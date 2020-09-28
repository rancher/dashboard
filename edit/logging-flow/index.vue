<script>
import Banner from '@/components/Banner';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { LOGGING, NODE, POD, SCHEMA } from '@/config/types';
import jsyaml from 'js-yaml';
import { createYaml } from '@/utils/create-yaml';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import { allHash } from '@/utils/promise';
import { isArray, uniq } from '@/utils/array';
import { matchRuleIsPopulated } from '@/models/logging.banzaicloud.io.flow';
import Select from '@/components/form/Select';
import { clone, set } from '@/utils/object';
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
    Loading,
    NameNsDescription,
    Tab,
    Tabbed,
    YamlEditor,
    Match,
    Select,
  },

  mixins: [CreateEditView],

  async fetch() {
    const outputType = (this.value.type === LOGGING.CLUSTER_FLOW ? LOGGING.CLUSTER_OUTPUT : LOGGING.OUTPUT);

    const hash = await allHash({
      allOutputs: this.$store.dispatch('cluster/findAll', { type: outputType }),
      allNodes:   this.$store.dispatch('cluster/findAll', { type: NODE }),
      allPods:    this.$store.dispatch('cluster/findAll', { type: POD }),
    });

    for ( const k of Object.keys(hash) ) {
      this[k] = hash[k];
    }
  },

  data() {
    const schemas = this.$store.getters['cluster/all'](SCHEMA);
    let filtersYaml;

    if ( this.value.spec?.filters?.length ) {
      filtersYaml = jsyaml.safeDump(this.value.spec.filters);
    } else {
      filtersYaml = createYaml(schemas, LOGGING.FLOW, {});
      filtersYaml = `# @TODO Get the right schema once it exists
# - stdout:
#   parser:
#   tag_normaliser:
#   dedot:
#   record_transformer:
#   record_modifier:
#   geoip:
#   concat:
#   detectExceptions:
#   grep:
#   prometheus:
#   throttl:
`;
    }

    const matches = [];
    let formSupported = !this.value.id || this.value.canCustomEdit;

    if ( this.value.spec?.match?.length ) {
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

    let outputs;

    if ( this.value.type === LOGGING.CLUSTER_FLOW ) {
      outputs = this.value.spec?.globalOutputRefs || [];
    } else {
      outputs = this.value.spec?.localOutputRefs || [];
    }

    return {
      formSupported,
      matches,
      allOutputs:         null,
      allNodes:           null,
      allPods:            null,
      filtersYaml,
      initialFiltersYaml:   filtersYaml,
      outputs,
    };
  },

  computed: {
    EDITOR_MODES() {
      return EDITOR_MODES;
    },

    outputChoices() {
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

    nodeChoices() {
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

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    willSave() {
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

      const filterJson = jsyaml.safeLoad(this.filtersYaml);

      if ( isArray(filterJson) ) {
        set(this.value.spec, 'filters', filterJson);
      } else {
        set(this.value.spec, 'filters', undefined);
      }

      const outputKey = (this.value.type === LOGGING.CLUSTER_FLOW ? 'globalOutputRefs' : 'localOutputRefs');

      set(this.value.spec, outputKey, this.outputs);
    },

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
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-if="!isView" v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <Tabbed :side-tabs="true" @changed="tabChanged($event)">
      <Tab name="match" :label="t('logging.flow.matches.label')" :weight="3">
        <Banner color="info" class="mt-0" label="Configure which container logs will be pulled from" />
        <Match
          v-for="(match, i) in matches"
          :key="i"
          class="rule mb-20"
          :value="match"
          :mode="mode"
          :nodes="nodeChoices"
          :containers="containerChoices"
          @remove="e=>removeMatch(i)"
          @input="e=>updateMatch(e,i)"
        />
        <button class="btn role-tertiary add mt-10" type="button" @click="addMatch(true)">
          <i class="icon icon-plus" />
          {{ t('logging.flow.matches.addSelect') }}
        </button>
        <button class="btn role-tertiary add mt-10" type="button" @click="addMatch(false)">
          <i class="icon icon-plus" />
          {{ t('logging.flow.matches.addExclude') }}
        </button>
      </Tab>

      <Tab name="filters" :label="t('logging.flow.filters.label')" :weight="2">
        <Banner color="info" class="mt-0" label="Filter or modify the data before it is sent to the output" />

        <YamlEditor
          ref="yaml"
          v-model="filtersYaml"
          :scrolling="false"
          :initial-yaml-values="initialFiltersYaml"
          :editor-mode="isView ? EDITOR_MODES.VIEW_CODE : EDITOR_MODES.EDIT_CODE"
        />
      </Tab>

      <Tab name="outputs" :label="t('logging.flow.outputs.label')" :weight="1">
        <Banner color="info" class="mt-0" label="Choose one or more outputs to send the matching logs to" />

        <Select
          v-model="outputs"
          class="lg"
          :options="outputChoices"
          placeholder="Default: Nowhere"
          :multiple="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          :reduce="opt=>opt.value"
        />
      </Tab>
    </Tabbed>
  </CruResource>
  <Banner v-else label="This resource contains a match configuration that the form editor does not support.  Please use YAML edit." color="error" />
</template>
