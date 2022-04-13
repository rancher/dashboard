<script>
import Banner from '@shell/components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { LOGGING, NODE, POD, SCHEMA } from '@shell/config/types';
import jsyaml from 'js-yaml';
import { createYaml } from '@shell/utils/create-yaml';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { allHash } from '@shell/utils/promise';
import { isArray, uniq } from '@shell/utils/array';
import { matchRuleIsPopulated } from '@shell/models/logging.banzaicloud.io.flow';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { clone, set } from '@shell/utils/object';
import isEmpty from 'lodash/isEmpty';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { exceptionToErrorsArray } from '@shell/utils/error';
import Match from './Match';

function emptyMatch(include = true) {
  const rule = {
    select:          !!include,
    exclude:         !include,
    labels:          {},
    hosts:           [],
    container_names: []
  };

  return rule;
}

export default {
  components: {
    Banner,
    CruResource,
    LabeledSelect,
    Loading,
    NameNsDescription,
    Tab,
    Tabbed,
    YamlEditor,
    Match,
    ArrayListGrouped
  },

  mixins: [CreateEditView],

  async fetch() {
    const hasAccessToClusterOutputs = this.$store.getters[`cluster/schemaFor`](LOGGING.CLUSTER_OUTPUT);
    const hasAccessToOutputs = this.$store.getters[`cluster/schemaFor`][LOGGING.OUTPUT];
    const hasAccessToNodes = this.$store.getters[`cluster/schemaFor`](NODE);
    const hasAccessToPods = this.$store.getters[`cluster/schemaFor`](POD);
    const isFlow = this.value.type === LOGGING.FLOW;

    const getAllOrDefault = (type, hasAccess) => {
      return hasAccess ? this.$store.dispatch('cluster/findAll', { type }) : Promise.resolve([]);
    };

    const hash = await allHash({
      allOutputs:        getAllOrDefault(LOGGING.OUTPUT, isFlow && hasAccessToOutputs),
      allClusterOutputs: getAllOrDefault(LOGGING.CLUSTER_OUTPUT, hasAccessToClusterOutputs),
      allNodes:          getAllOrDefault(NODE, hasAccessToNodes),
      allPods:           getAllOrDefault(POD, hasAccessToPods),
    });

    for ( const k of Object.keys(hash) ) {
      this[k] = hash[k] || [];
    }
  },

  data() {
    const schemas = this.$store.getters['cluster/all'](SCHEMA);
    let filtersYaml;

    set(this.value, 'spec', this.value.spec || {});

    if ( this.value.spec.filters?.length ) {
      filtersYaml = jsyaml.dump(this.value.spec.filters);
    } else {
      filtersYaml = createYaml(schemas, LOGGING.SPOOFED.FILTERS, []);
      // createYaml doesn't support passing reference types (array, map) as the first type. As such
      // I'm manipulating the output since I'm not sure it's something we want to actually support
      // seeing as it's really createResourceYaml and this here is a gray area between spoofed types
      // and just a field within a spec.
      filtersYaml = filtersYaml.substring(filtersYaml.indexOf('\n') + 1).replaceAll('#  ', '#');
    }

    const matches = [];
    let formSupported = !this.value.id || this.value.canCustomEdit;

    if ( this.value.spec.match?.length ) {
      for ( const match of this.value.spec.match ) {
        if ( matchRuleIsPopulated(match.select) && matchRuleIsPopulated(match.exclude) ) {
          formSupported = false;
        } else if ( matchRuleIsPopulated(match.select) ) {
          matches.push({ select: true, ...match.select });
        } else if ( matchRuleIsPopulated(match.exclude) ) {
          matches.push({ exclude: true, ...match.exclude });
        }
      }
    } else {
      matches.push(emptyMatch(true));
    }

    const globalOutputRefs = (this.value.spec.globalOutputRefs || []).map(ref => ({ label: ref, value: ref }));
    const localOutputRefs = (this.value.spec.localOutputRefs || []).map(ref => ({ label: ref, value: ref }));

    return {
      formSupported,
      matches,
      allOutputs:         null,
      allClusterOutputs:  null,
      allNodes:           null,
      allPods:            null,
      filtersYaml,
      initialFiltersYaml:   filtersYaml,
      globalOutputRefs,
      localOutputRefs
    };
  },

  computed: {
    EDITOR_MODES() {
      return EDITOR_MODES;
    },

    LOGGING() {
      return LOGGING;
    },

    outputChoices() {
      if (!this.allOutputs) {
        // Handle the case where the user doesn't have permission
        // to see Outputs
        return [];
      }

      // Yes cluster outputs are still namespaced because reasons...
      return this.allOutputs.filter((output) => {
        if ( !output.namespace) {
          return true;
        }

        return output.namespace === this.value.namespace;
      }).map((x) => {
        return { label: x.metadata.name, value: x.metadata.name };
      });
    },

    clusterOutputChoices() {
      if (!this.allClusterOutputs) {
        // Handle the case where the user doesn't have permission
        // to see ClusterOutputs
        return [];
      }

      return this.allClusterOutputs
        .filter((clusterOutput) => {
          return clusterOutput.namespace === 'cattle-logging-system';
        })
        .map((clusterOutput) => {
          return { label: clusterOutput.metadata.name, value: clusterOutput.metadata.name };
        });
    },

    nodeChoices() {
      if (!this.allNodes) {
        // Handle the case where the user doesn't have permission
        // to see nodes
        return [];
      }
      const out = this.allNodes.map((node) => {
        return {
          label: node.nameDisplay,
          value: node.metadata.name
        };
      });

      return out;
    },

    containerChoices() {
      const out = [];

      for ( const pod of this.allPods ) {
        for ( const c of (pod.spec?.containers || []) ) {
          out.push(c.name);
        }
      }

      return uniq(out).sort();
    },
  },

  watch: {
    matches: {
      deep: true,
      handler() {
        const matches = this.matches.map((match) => {
          const copy = clone(match);

          delete copy.exclude;
          delete copy.select;

          if ( match.exclude ) {
            return { exclude: copy };
          } else {
            return { select: copy };
          }
        });

        set(this.value.spec, 'match', matches);
      }
    },
    filtersYaml: {
      deep: true,
      handler() {
        try {
          const filterJson = jsyaml.load(this.filtersYaml);

          if ( isArray(filterJson) ) {
            set(this.value.spec, 'filters', filterJson);
          } else {
            set(this.value.spec, 'filters', undefined);
          }
        } catch (e) {
          this.errors = exceptionToErrorsArray(e);
        }
      }
    },
    globalOutputRefs: {
      deep: true,
      handler() {
        set(this.value.spec, 'globalOutputRefs', this.globalOutputRefs);
      }
    },
    localOutputRefs: {
      deep: true,
      handler() {
        set(this.value.spec, 'localOutputRefs', this.localOutputRefs);
      }
    }
  },

  created() {
    if (this.isCreate && this.value.type === LOGGING.CLUSTER_FLOW) {
      this.value.metadata.namespace = 'cattle-logging-system';
    }

    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    addMatch(include) {
      this.matches.push(emptyMatch(include));
    },

    removeMatch(idx) {
      this.matches.splice(idx, 1);
    },

    updateMatch(neu, idx) {
      this.$set(this.matches, idx, neu);
    },

    tabChanged({ tab }) {
      if ( tab.name === 'filters' ) {
        this.$nextTick(() => {
          if ( this.$refs.yaml ) {
            this.$refs.yaml.refresh();
            this.$refs.yaml.focus();
          }
        });
      }
    },
    isMatchEmpty(matches) {
      if (isEmpty(matches)) {
        return true;
      }

      return matches.every((match) => {
        if (isEmpty(match.select) && isEmpty(match.exclude)) {
          return true;
        }

        const select = match.select || {};
        const exclude = match.exclude || {};
        const allValuesAreEmpty = o => Object.values(o).every(isEmpty);

        return allValuesAreEmpty(select) && allValuesAreEmpty(exclude);
      });
    },
    willSave() {
      if (this.value.spec.filters && isEmpty(this.value.spec.filters)) {
        this.$delete(this.value.spec, 'filters');
      }

      if (this.value.spec.match && this.isMatchEmpty(this.value.spec.match)) {
        this.$delete(this.value.spec, 'match');
      }
    },
    onYamlEditorReady(cm) {
      cm.getMode().fold = 'yamlcomments';
      cm.execCommand('foldAll');
      cm.execCommand('unfold');
    },
    isTag(options, option) {
      return !options.find(o => o.value === option.value);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else-if="formSupported"
    class="flow"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    :apply-hooks="applyHooks"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-if="!isView" v-model="value" :mode="mode" :namespaced="value.type !== LOGGING.CLUSTER_FLOW" />

    <Tabbed :side-tabs="true" @changed="tabChanged($event)">
      <Tab name="match" :label="t('logging.flow.matches.label')" :weight="3">
        <Banner color="info" class="mt-0" label="Configure which container logs will be pulled from" />
        <ArrayListGrouped v-model="matches" :add-label="t('ingress.rules.addRule')" :default-add-value="{}" :mode="mode">
          <template #default="props">
            <Match
              class="rule mb-20"
              :value="props.row.value"
              :mode="mode"
              :nodes="nodeChoices"
              :containers="containerChoices"
              @remove="e=>removeMatch(props.row.i)"
              @input="e=>updateMatch(e,props.row.i)"
            />
          </template>
          <template #add>
            <button class="btn role-tertiary add" type="button" @click="addMatch(true)">
              {{ t('logging.flow.matches.addSelect') }}
            </button>
            <button class="btn role-tertiary add" type="button" @click="addMatch(false)">
              {{ t('logging.flow.matches.addExclude') }}
            </button>
          </template>
        </ArrayListGrouped>
      </Tab>

      <Tab name="outputs" :label="t('logging.flow.outputs.label')" :weight="2">
        <Banner v-if="value.type !== LOGGING.CLUSTER_FLOW" label="Output must reside in same namespace as the flow." color="info" />
        <LabeledSelect
          v-model="globalOutputRefs"
          :label="t('logging.flow.clusterOutputs.label')"
          :options="clusterOutputChoices"
          :multiple="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          :reduce="opt=>opt.value"
        >
          <template #selected-option="option">
            <i v-if="isTag(clusterOutputChoices, option)" v-tooltip="t('logging.flow.clusterOutputs.doesntExistTooltip')" class="icon icon-info status-icon text-warning" />
            {{ option.label }}
          </template>
        </LabeledSelect>
        <LabeledSelect
          v-if="value.type === LOGGING.FLOW"
          v-model="localOutputRefs"
          :label="t('logging.flow.outputs.label')"
          class="mt-10"
          :options="outputChoices"
          :multiple="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          :reduce="opt=>opt.value"
        >
          <template #selected-option="option">
            <i v-if="isTag(outputChoices, option)" v-tooltip="t('logging.flow.outputs.doesntExistTooltip')" class="icon icon-info status-icon text-warning" />
            {{ option.label }}
          </template>
        </LabeledSelect>
      </Tab>

      <Tab name="filters" :label="t('logging.flow.filters.label')" :weight="1">
        <YamlEditor
          ref="yaml"
          v-model="filtersYaml"
          :scrolling="false"
          :initial-yaml-values="initialFiltersYaml"
          :editor-mode="isView ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE"
          @onReady="onYamlEditorReady"
        />
      </Tab>
    </Tabbed>
  </CruResource>
  <Banner v-else label="This resource contains a match configuration that the form editor does not support.  Please use YAML edit." color="error" />
</template>

<style lang="scss" scoped>
::v-deep {
  .icon-info {
    margin-top: -3px;
    margin-right: 4px;
  }
}
</style>
