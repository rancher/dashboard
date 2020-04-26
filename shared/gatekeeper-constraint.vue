<script>
import Vue from 'vue';
import { merge } from 'lodash';
import jsyaml from 'js-yaml';
import { _VIEW, _CREATE } from '../config/query-params';
import { SCHEMA, NAMESPACE } from '@/config/types';
import MatchKinds from '@/components/form/MatchKinds';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import KeyValue from '@/components/form/KeyValue';
import LabeledSelect from '@/components/form/LabeledSelect';
import NamespaceList, { NAMESPACE_FILTERS } from '@/components/form/NamespaceList';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import Footer from '@/components/form/Footer';
import GatekeeperViolationsTable from '@/components/GatekeeperViolationsTable';
import RuleSelector from '@/components/form/RuleSelector';
import RadioGroup from '@/components/form/RadioGroup';
import { ucFirst } from '@/utils/string';
import { isSimpleKeyValue } from '@/utils/object';

function findConstraintTypes(schemas) {
  return schemas
    .filter(schema => schema?.attributes?.group === 'constraints.gatekeeper.sh');
}

function findConstraintTypesIds(schemas) {
  return findConstraintTypes(schemas)
    .map(schema => schema.id);
}

const CONSTRAINT_PREFIX = 'constraints.gatekeeper.sh.';
const ENFORCEMENT_ACTION_VALUES = {
  DENY:   'deny',
  DRYRUN: 'dryrun'
};

export default {
  components: {
    Footer,
    GatekeeperViolationsTable,
    KeyValue,
    LabeledSelect,
    MatchKinds,
    NameNsDescription,
    NamespaceList,
    RuleSelector,
    RadioGroup,
    Tab,
    Tabbed,
    YamlEditor
  },

  extends: CreateEditView,

  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  data() {
    return {
      parametersYaml:           this.value?.spec?.parameters ? jsyaml.safeDump(this.value.spec.parameters) : '',
      showParametersAsYaml:     !isSimpleKeyValue(this.value.spec.parameters),
      enforcementActionOptions: Object.values(ENFORCEMENT_ACTION_VALUES),
      enforcementActionLabels:  Object.values(ENFORCEMENT_ACTION_VALUES).map(ucFirst),
      NAMESPACE_FILTERS
    };
  },

  computed: {
    extraDetailColumns() {
      return [
        {
          title:   'Template',
          content: this.templateOptions.find(o => o.value === this.value.type).label
        }
      ];
    },
    templateOptions() {
      const schemas = this.$store.getters['cluster/all'](SCHEMA);
      const constraintTypes = findConstraintTypesIds(schemas);

      constraintTypes.sort();

      return constraintTypes.map((type) => {
        return {
          label: type.replace(CONSTRAINT_PREFIX, ''),
          value: type
        };
      });
    },
    isView() {
      return this.mode === _VIEW;
    },
    isCreate() {
      return this.mode === _CREATE;
    },
    editorMode() {
      return this.mode === _VIEW
        ? EDITOR_MODES.VIEW_CODE
        : EDITOR_MODES.EDIT_CODE;
    },
    canShowForm() {
      return this.value?.spec?.parameters && isSimpleKeyValue(this.value.spec.parameters) && !this.isView;
    },
    systemNamespaceIds() {
      return this.$store.getters['cluster/all'](NAMESPACE)
        .filter(namespace => namespace.isSystem)
        .map(namespace => namespace.id);
    },
    emptyDefaults() {
      return {
        type:  this.templateOptions[0].value,
        spec: {
          enforcementAction: ENFORCEMENT_ACTION_VALUES.DENY,
          parameters:        {},
          match:             {
            kinds:              [{ apiGroups: [''] }],
            namespaces:         [],
            excludedNamespaces: [],
            labelSelector:      { matchExpressions: [] },
            namespaceSelector:  { matchExpressions: [] }
          }
        }
      };
    },
    isTemplateSelectorDisabled() {
      return !this.isCreate;
    }
  },

  watch: {
    value: {
      handler(value) {
        // We have to set the type for the CreateEditView mixin to know what the type is when creating
        this.type = value.type;
        this.purgeNamespacesField(this.value);
      },
      deep: true
    },
  },

  async created() {
    if (!this.value.save) {
      this.$emit('input', merge(await this.createConstraint(), this.value, this.emptyDefaults));
    }
  },

  methods: {
    async createConstraint() {
      const constraint = await this.$store.dispatch('cluster/create', { type: this.templateOptions[0].value });

      constraint.spec = { match: { excludedNamespaces: this.systemNamespaceIds } };

      return constraint;
    },
    done() {
      this.$router.replace({
        name:   'c-cluster-gatekeeper-constraints',
        params: this.$route.params
      });
    },
    /**
     * There's an upstream issue which prevents gatekeeper from processing namespaces with empty lists incorrectly.
     * We need to remove the namespaces field if it's empty.
     * https://github.com/open-policy-agent/gatekeeper/issues/508
     */
    purgeNamespacesField(value) {
      if (value?.spec?.match?.namespaces && (value.spec.match.namespaces.length === 0)) {
        Vue.delete(value.spec.match, 'namespaces');
      }
    },

    updateType(type) {
      this.$set(this.value, 'type', type);
    },
    toggleParametersEditor() {
      this.showParametersAsYaml = !this.showParametersAsYaml;
      if (this.showParametersAsYaml) {
        this.parametersYaml = jsyaml.safeDump(this.value.spec.parameters);
      }
    }
  }
};
</script>
<template>
  <div v-if="value.save" class="gatekeeper-constraint">
    <div>
      <NameNsDescription
        :value="value"
        :mode="mode"
        :namespaced="false"
        :extra-columns="['template']"
        :extra-detail-columns="extraDetailColumns"
      >
        <template v-slot:template>
          <LabeledSelect
            :mode="mode"
            :value="value.type"
            :options="templateOptions"
            :disabled="isTemplateSelectorDisabled"
            label="Template"
            @input="updateType"
          />
        </template>
      </NameNsDescription>
    </div>
    <br />
    <div v-if="isView">
      <h2>Violations</h2>
      <GatekeeperViolationsTable :constraint="value" />
      <br />
    </div>
    <div>
      <h2 class="parameters">
        Parameters
        <a v-if="showParametersAsYaml && canShowForm" href="#" @click="toggleParametersEditor">Edit as Form</a>
        <a v-else-if="canShowForm" href="#" @click="toggleParametersEditor">Edit as YAML</a>
      </h2>
      <YamlEditor
        v-if="showParametersAsYaml"
        v-model="parametersYaml"
        class="yaml-editor"
        :editor-mode="editorMode"
        @newObject="$set(value.spec, 'parameters', $event)"
      />
      <KeyValue
        v-else
        v-model="value.spec.parameters"
        :value-multiline="false"
        :mode="mode"
        :pad-left="false"
        :read-allowed="false"
        :as-map="true"
        add-label="Add Parameter"
        :protip="false"
      />
    </div>
    <br />
    <div>
      <h2>Enforcement Action</h2>
      <RadioGroup
        v-model="value.spec.enforcementAction"
        class="enforcement-action"
        :options="enforcementActionOptions"
        :labels="enforcementActionLabels"
        :mode="mode"
        @input="e=>value.spec.enforcementAction = e"
      />
    </div>
    <br />
    <br />
    <div class="match">
      <h2>Match</h2>
      <Tabbed default-tab="labels">
        <Tab name="namespaces" label="Namespaces">
          <div class="row">
            <div class="col span-6">
              <h4>Namespaces</h4>
              <NamespaceList v-model="value.spec.match.namespaces" :mode="mode" :namespace-filter="NAMESPACE_FILTERS.nonSystem" />
            </div>
            <div class="col span-6">
              <h4>Excluded Namespaces</h4>
              <NamespaceList v-model="value.spec.match.excludedNamespaces" :mode="mode" />
            </div>
          </div>
        </Tab>
        <Tab name="selectors" label="Selectors">
          <div class="row">
            <div class="col span-6">
              <h4>Label Selector</h4>
              <RuleSelector
                v-model="value.spec.match.labelSelector.matchExpressions"
                add-label="Add Label"
                :mode="mode"
              />
            </div>
            <div class="col span-6">
              <h4>Namespace Selector</h4>
              <RuleSelector
                v-model="value.spec.match.namespaceSelector.matchExpressions"
                add-label="Add Namespace"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>
        <Tab name="kinds" label="Kinds">
          <MatchKinds v-model="value.spec.match.kinds" :mode="mode" />
        </Tab>
      </Tabbed>
    </div>
    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </div>
</template>

<style lang="scss">
.gatekeeper-constraint {
  .yaml-editor {
    margin-top: 10px;
    height: 200px;
  }

  .parameters a {
    font-size: 12px;
    font-weight: 500;
  }
  .enforcement-action {
    max-width: 200px;
  }
}

</style>
