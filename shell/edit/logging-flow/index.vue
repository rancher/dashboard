<script>
import { Banner } from '@components/Banner';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { LOGGING, NAMESPACE, NODE, SCHEMA } from '@shell/config/types';
import jsyaml from 'js-yaml';
import { createYaml } from '@shell/utils/create-yaml';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { allHash } from '@shell/utils/promise';
import { isArray } from '@shell/utils/array';
import { matchRuleIsPopulated } from '@shell/models/logging.banzaicloud.io.flow';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { clone } from '@shell/utils/object';
import isEmpty from 'lodash/isEmpty';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/features';
import Match from './Match';

const FLOW_LOGGING = 'Logging';
const FLOW_AUDIT = 'Audit';
const FLOW_EVENT = 'Event';
const FLOW_TYPE = [FLOW_LOGGING, FLOW_AUDIT, FLOW_EVENT];

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
  emits: ['input'],

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

  inheritAttrs: false,

  async fetch() {
    const currentCluster = this.$store.getters['currentCluster'];
    const inStore = currentCluster.isHarvester ? VIRTUAL : 'cluster';
    const hasAccessToClusterOutputs = this.$store.getters[`${ inStore }/schemaFor`](LOGGING.CLUSTER_OUTPUT);
    const hasAccessToOutputs = this.$store.getters[`${ inStore }/schemaFor`](LOGGING.OUTPUT);
    const hasAccessToNamespaces = this.$store.getters[`cluster/schemaFor`](NAMESPACE);
    const hasAccessToNodes = this.$store.getters[`${ inStore }/schemaFor`](NODE);
    const isFlow = this.value.type === LOGGING.FLOW;

    const getAllOrDefault = (type, hasAccess) => {
      return hasAccess ? this.$store.dispatch(`${ inStore }/findAll`, { type }) : Promise.resolve([]);
    };

    const hash = await allHash({
      allOutputs:        getAllOrDefault(LOGGING.OUTPUT, isFlow && hasAccessToOutputs),
      allClusterOutputs: getAllOrDefault(LOGGING.CLUSTER_OUTPUT, hasAccessToClusterOutputs),
      // Can't remove allNamespaces yet given https://github.com/harvester/harvester/issues/7342 and
      // https://github.com/harvester/harvester-ui-extension/blob/main/pkg/harvester/edit/harvesterhci.io.logging.clusteroutput.vue
      allNamespaces:     getAllOrDefault(NAMESPACE, hasAccessToNamespaces),
      allNodes:          getAllOrDefault(NODE, hasAccessToNodes),
    });

    for ( const k of Object.keys(hash) ) {
      this[k] = hash[k] || [];
    }
  },

  data() {
    const currentCluster = this.$store.getters['currentCluster'];
    const inStore = currentCluster.isHarvester ? VIRTUAL : 'cluster';
    const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
    let filtersYaml;

    this.value.spec = this.value.spec || {};

    if ( this.value.spec.filters?.length ) {
      filtersYaml = jsyaml.dump(this.value.spec.filters);
    } else {
      // Note - no need to call fetchResourceFields here (spoofed type has popoulated resourceFields)
      filtersYaml = createYaml(schemas, LOGGING.SPOOFED.FILTERS, {});
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

    const globalOutputRefs = (this.value.spec.globalOutputRefs || []).map((ref) => ({ label: ref, value: ref }));
    const localOutputRefs = (this.value.spec.localOutputRefs || []).map((ref) => ({ label: ref, value: ref }));

    return {
      formSupported,
      matches,
      allOutputs:         null,
      allClusterOutputs:  null,
      allNamespaces:      null,
      allNodes:           null,
      filtersYaml,
      initialFiltersYaml: filtersYaml,
      globalOutputRefs,
      localOutputRefs,
      loggingType:        clone(this.value.loggingType || FLOW_LOGGING)
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

        const isEqualNs = output.namespace === this.value.namespace;

        if (!this.isHarvester) {
          return isEqualNs;
        }

        if (this.loggingType === FLOW_AUDIT) {
          return output.loggingType === FLOW_AUDIT && isEqualNs;
        }

        return output.loggingType !== FLOW_AUDIT && isEqualNs;
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
          const isEqualNs = clusterOutput.namespace === 'cattle-logging-system';

          if (!this.isHarvester) {
            return isEqualNs;
          }

          if (this.loggingType === FLOW_AUDIT) {
            return clusterOutput.loggingType === FLOW_AUDIT && isEqualNs;
          }

          return clusterOutput.loggingType !== FLOW_AUDIT && isEqualNs;
        })
        .map((clusterOutput) => {
          return { label: clusterOutput.metadata.name, value: clusterOutput.metadata.name };
        });
    },

    namespaceChoices() {
      if (!this.allNamespaces) {
        // Handle the case where the user doesn't have permission
        // to see namespaces
        return [];
      }
      const out = this.allNamespaces.map((namespace) => {
        return {
          label: namespace.nameDisplay,
          value: namespace.metadata.name
        };
      });

      return out;
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

    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === VIRTUAL;
    },

    flowTypeOptions() {
      return FLOW_TYPE;
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

        this.value.spec.match = matches;
      }
    },
    filtersYaml: {
      deep: true,
      handler() {
        try {
          const filterJson = jsyaml.load(this.filtersYaml);

          if ( isArray(filterJson) ) {
            this.value.spec.filters = filterJson;
          } else {
            this.value.spec.filters = undefined;
          }
        } catch (e) {
          this.errors = exceptionToErrorsArray(e);
        }
      }
    },
    globalOutputRefs: {
      deep: true,
      handler() {
        this.value.spec.globalOutputRefs = this.globalOutputRefs;
      }
    },
    localOutputRefs: {
      deep: true,
      handler() {
        this.value.spec.localOutputRefs = this.localOutputRefs;
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
      this.matches = [...this.matches, emptyMatch(include)];
    },

    removeMatch(idx) {
      this.matches.splice(idx, 1);
    },

    updateMatch(neu, idx) {
      this.matches[idx] = neu;
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
        const allValuesAreEmpty = (o) => Object.values(o).every(isEmpty);

        return allValuesAreEmpty(select) && allValuesAreEmpty(exclude);
      });
    },
    willSave() {
      if (this.value.spec.filters && isEmpty(this.value.spec.filters)) {
        delete this.value.spec['filters'];
      }

      if (this.value.spec.match && this.isMatchEmpty(this.value.spec.match)) {
        delete this.value.spec['match'];
      }

      if (this.loggingType === FLOW_AUDIT) {
        this.value.spec['loggingRef'] = 'harvester-kube-audit-log-ref';
      }

      if (this.loggingType === FLOW_EVENT) {
        const eventSelector = { select: { labels: { 'app.kubernetes.io/name': 'event-tailer' } } };

        if (!this.value.spec.match) {
          this.value.spec['match'] = [eventSelector];
        } else {
          this.value.spec.match.push(eventSelector);
        }
      }
    },
    onYamlEditorReady(cm) {
      cm.getMode().fold = 'yamlcomments';
      cm.execCommand('foldAll');
      cm.execCommand('unfold');
    },
    isTag(options, option) {
      return !options.find((o) => o.value === option.value);
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
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :mode="mode"
      :namespaced="value.type !== LOGGING.CLUSTER_FLOW"
      @update:value="$emit('input', $event)"
    />

    <Tabbed
      :side-tabs="true"
      @changed="tabChanged($event)"
    >
      <Tab
        name="match"
        :label="t('logging.flow.matches.label')"
        :weight="3"
      >
        <Banner
          v-if="!isHarvester"
          color="info"
          class="mt-0"
          :label="t('logging.flow.matches.banner')"
        />
        <div v-if="isHarvester">
          <LabeledSelect
            v-model:value="loggingType"
            class="mb-20"
            :options="flowTypeOptions"
            :mode="mode"
            :disabled="!isCreate"
            :label="t('generic.type')"
          />
        </div>
        <ArrayListGrouped
          v-model:value="matches"
          :add-label="t('ingress.rules.addRule')"
          :default-add-value="{}"
          :mode="mode"
        >
          <template #default="props">
            <Match
              class="rule mb-20"
              :value="props.row.value"
              :mode="mode"
              :namespaces="namespaceChoices"
              :nodes="nodeChoices"
              :is-cluster-flow="value.type === LOGGING.CLUSTER_FLOW"
              @remove="e=>removeMatch(props.row.i)"
              @update:value="e=>updateMatch(e,props.row.i)"
            />
          </template>
          <template #add>
            <button
              class="btn role-tertiary add"
              type="button"
              @click="addMatch(true)"
            >
              {{ t('logging.flow.matches.addSelect') }}
            </button>
            <button
              class="btn role-tertiary add"
              type="button"
              @click="addMatch(false)"
            >
              {{ t('logging.flow.matches.addExclude') }}
            </button>
          </template>
        </ArrayListGrouped>
      </Tab>

      <Tab
        name="outputs"
        :label="t('logging.flow.outputs.label')"
        :weight="2"
      >
        <Banner
          v-if="value.type !== LOGGING.CLUSTER_FLOW"
          :label="t('logging.flow.outputs.sameNamespaceError')"
          color="info"
        />
        <LabeledSelect
          v-model:value="globalOutputRefs"
          :label="t('logging.flow.clusterOutputs.label')"
          :options="clusterOutputChoices"
          :multiple="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          :reduce="opt=>opt.value"
        >
          <template #selected-option="option">
            <i
              v-if="isTag(clusterOutputChoices, option)"
              v-clean-tooltip="t('logging.flow.clusterOutputs.doesntExistTooltip')"
              class="icon icon-info status-icon text-warning"
            />
            {{ option.label }}
          </template>
        </LabeledSelect>
        <LabeledSelect
          v-if="value.type === LOGGING.FLOW"
          v-model:value="localOutputRefs"
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
            <i
              v-if="isTag(outputChoices, option)"
              v-clean-tooltip="t('logging.flow.outputs.doesntExistTooltip')"
              class="icon icon-info status-icon text-warning"
            />
            {{ option.label }}
          </template>
        </LabeledSelect>
      </Tab>

      <Tab
        name="filters"
        :label="t('logging.flow.filters.label')"
        :weight="1"
      >
        <YamlEditor
          ref="yaml"
          v-model:value="filtersYaml"
          :scrolling="false"
          :initial-yaml-values="initialFiltersYaml"
          :editor-mode="isView ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE"
          @onReady="onYamlEditorReady"
        />
      </Tab>
    </Tabbed>
  </CruResource>
  <Banner
    v-else
    :label="t('logging.flow.matches.unsupportedConfig')"
    color="error"
  />
</template>

<style lang="scss" scoped>
:deep() {
  .icon-info {
    margin-top: -3px;
    margin-right: 4px;
  }
}
</style>
