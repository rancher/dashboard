<script>
import Vue from 'vue';
import merge from 'lodash/merge';
import jsyaml from 'js-yaml';
import { ucFirst } from '@/utils/string';
import { isSimpleKeyValue } from '@/utils/object';
import { _VIEW } from '@/config/query-params';
import { SCHEMA, NAMESPACE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import Footer from '@/components/form/Footer';
import Masthead from '@/components/ResourceDetail/Masthead';
import KeyValue from '@/components/form/KeyValue';
import LabeledSelect from '@/components/form/LabeledSelect';
import MatchKinds from '@/components/form/MatchKinds';
import NameNsDescription from '@/components/form/NameNsDescription';
import NamespaceList, { NAMESPACE_FILTERS } from '@/components/form/NamespaceList';
import RadioGroup from '@/components/form/RadioGroup';
import ResourceTabs from '@/components/form/ResourceTabs';
import RuleSelector from '@/components/form/RuleSelector';
import Tab from '@/components/Tabbed/Tab';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import GatekeeperViolationsTable from '@/components/chart/gatekeeper/ViolationsTable';

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
    Masthead,
    MatchKinds,
    NameNsDescription,
    NamespaceList,
    RuleSelector,
    RadioGroup,
    Tab,
    YamlEditor,
    ResourceTabs
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
    detailTopColumns() {
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
    editorMode() {
      if ( this.mode === _VIEW ) {
        return EDITOR_MODES.VIEW_CODE;
      } else {
        return EDITOR_MODES.EDIT_CODE;
      }
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
            kinds:              [{}],
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
    },
    parentOverride() {
      const schema = this.$store.getters['cluster/schemaFor'](this.value.type);
      const displayName = this.$store.getters['type-map/labelFor'](schema);
      const location = { name: 'c-cluster-gatekeeper-constraints' };

      return { displayName, location };
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
    this.registerBeforeHook(this.willSave, 'willSave');
    if (!this.value.save) {
      this.$emit('input', merge(await this.createConstraint(), this.value, this.emptyDefaults));
    }
  },

  methods: {
    willSave() {
      this.value.spec.match.kinds.forEach((kind) => {
        const apiGroups = kind.apiGroups || [];

        if (apiGroups.length === 0) {
          kind.apiGroups = ['*'];
        }
      });
    },
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
      <Masthead
        v-if="isCreate"
        :value="value"
        :mode="mode"
        :parent-override="parentOverride"
      />
      <NameNsDescription
        v-if="!isView"
        :value="value"
        :mode="mode"
        :namespaced="false"
        :extra-columns="['template']"
      >
        <template v-slot:template>
          <LabeledSelect
            :mode="mode"
            :value="value.type"
            :options="templateOptions"
            :disabled="isTemplateSelectorDisabled"
            :label="t('gatekeeperConstraint.template')"
            @input="updateType"
          />
        </template>
      </NameNsDescription>
    </div>
    <div class="spacer"></div>
    <div v-if="isView">
      <h2>{{ t('gatekeeperConstraint.violations.title') }}</h2>
      <GatekeeperViolationsTable :constraint="value" />
    </div>
    <div>
      <h2 class="parameters">
        {{ t('gatekeeperConstraint.parameters.title') }}
        <a v-if="showParametersAsYaml && canShowForm" href="#" @click="toggleParametersEditor">{{ t('gatekeeperConstraint.parameters.editAsForm') }}</a>
        <a v-else-if="canShowForm" href="#" @click="toggleParametersEditor">{{ t('gatekeeperConstraint.parameters.editAsYaml') }}</a>
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
        :add-label="t('gatekeeperConstraint.parameters.addParameter')"
        :protip="false"
      />
    </div>
    <div class="spacer"></div>
    <div>
      <h2>{{ t('gatekeeperConstraint.enforcementAction.title') }}</h2>
      <RadioGroup
        v-model="value.spec.enforcementAction"
        class="enforcement-action"
        :options="enforcementActionOptions"
        :labels="enforcementActionLabels"
        :mode="mode"
        @input="e=>value.spec.enforcementAction = e"
      />
    </div>
    <div class="spacer"></div>
    <div class="match">
      <h2>{{ t('gatekeeperConstraint.match.title') }}</h2>
      <ResourceTabs v-model="value" :mode="mode">
        <template #before>
          <Tab name="namespaces" :label="t('gatekeeperConstraint.tab.namespaces.title')">
            <div class="row">
              <div class="col span-6">
                <h3>{{ t('gatekeeperConstraint.tab.namespaces.sub.namespaces') }}</h3>
                <NamespaceList v-model="value.spec.match.namespaces" :mode="mode" :namespace-filter="NAMESPACE_FILTERS.nonSystem" />
              </div>
              <div class="col span-6">
                <h3>{{ t('gatekeeperConstraint.tab.namespaces.sub.excludedNamespaces') }}</h3>
                <NamespaceList v-model="value.spec.match.excludedNamespaces" :mode="mode" />
              </div>
            </div>
          </Tab>
          <Tab name="selectors" :label="t('gatekeeperConstraint.tab.selectors.title')">
            <div class="row">
              <div class="col span-6">
                <h3>{{ t('gatekeeperConstraint.tab.selectors.sub.labelSelector.title') }}</h3>
                <RuleSelector
                  v-model="value.spec.match.labelSelector.matchExpressions"
                  :add-label="t('gatekeeperConstraint.tab.selectors.sub.labelSelector.addLabel')"
                  :mode="mode"
                />
              </div>
              <div class="col span-6">
                <h3>{{ t('gatekeeperConstraint.tab.selectors.sub.namespaceSelector.title') }}</h3>
                <RuleSelector
                  v-model="value.spec.match.namespaceSelector.matchExpressions"
                  :add-label="t('gatekeeperConstraint.tab.selectors.sub.namespaceSelector.addNamespace')"
                  :mode="mode"
                />
              </div>
            </div>
          </Tab>
          <Tab name="kinds" :label="t('gatekeeperConstraint.tab.kinds.title')">
            <MatchKinds v-model="value.spec.match.kinds" :mode="mode" />
          </Tab>
        </template>
      </ResourceTabs>
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
