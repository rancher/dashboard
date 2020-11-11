<script>
import Vue from 'vue';
import merge from 'lodash/merge';
import jsyaml from 'js-yaml';
import { ucFirst } from '@/utils/string';
import { isSimpleKeyValue } from '@/utils/object';
import { _VIEW } from '@/config/query-params';
import { SCHEMA, NAMESPACE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import RadioGroup from '@/components/form/RadioGroup';
import RuleSelector from '@/components/form/RuleSelector';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import GatekeeperViolationsTable from '@/components/gatekeeper/ViolationsTable';
import CruResource from '@/components/CruResource';
import { ENFORCEMENT_ACTION_VALUES } from '@/models/constraints.gatekeeper.sh.constraint';
import { defaultAsyncData } from '@/components/ResourceDetail';
import NamespaceList, { NAMESPACE_FILTERS } from './NamespaceList';
import MatchKinds from './MatchKinds';
import Scope, { SCOPE_OPTIONS } from './Scope';

function findConstraintTypes(schemas) {
  return schemas
    .filter(schema => schema?.attributes?.group === 'constraints.gatekeeper.sh');
}

function findConstraintTypesIds(schemas) {
  return findConstraintTypes(schemas)
    .map(schema => schema.id);
}

const CONSTRAINT_PREFIX = 'constraints.gatekeeper.sh.';

export default {
  components: {
    CruResource,
    GatekeeperViolationsTable,
    MatchKinds,
    NameNsDescription,
    NamespaceList,
    RuleSelector,
    RadioGroup,
    Scope,
    Tab,
    Tabbed,
    YamlEditor
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  asyncData(ctx) {
    function yamlSave(value, originalValue) {
      originalValue.yamlSaveOverride(value, originalValue);
    }

    return defaultAsyncData(ctx, null, { yamlSave });
  },

  data() {
    const emptySpec = {
      enforcementAction: ENFORCEMENT_ACTION_VALUES.DENY,
      parameters:        {},
      match:             {
        kinds:              [{}],
        namespaces:         [],
        excludedNamespaces: [],
        labelSelector:      { matchExpressions: [] },
        namespaceSelector:  { matchExpressions: [] }
      }
    };

    this.value.spec = merge(this.value.spec, emptySpec);
    let parametersYaml = this.value?.spec?.parameters ? jsyaml.safeDump(this.value.spec.parameters) : '';

    if (parametersYaml === '{}\n') {
      parametersYaml = '';
    }

    if (!this.value.spec.match.scope) {
      this.value.spec.match.scope = SCOPE_OPTIONS[0];
    }

    return {
      emptySpec,
      parametersYaml,
      enforcementActionOptions: Object.values(ENFORCEMENT_ACTION_VALUES),
      enforcementActionLabels:  Object.values(ENFORCEMENT_ACTION_VALUES).map(ucFirst),
      NAMESPACE_FILTERS,
    };
  },

  computed: {
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
    templateSubtypes() {
      const schemas = this.$store.getters['cluster/all'](SCHEMA);
      const constraintTypes = findConstraintTypes(schemas);

      constraintTypes.sort();

      return constraintTypes.map((type) => {
        return {
          label:       type.id.replace(CONSTRAINT_PREFIX, ''),
          description: '',
          id:          type.id,
          bannerAbbrv: 'CT'
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
        spec: this.emptySpec
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

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
    if (!this.value.save) {
      this.$emit('input', merge(this.value, this.emptyDefaults));
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
    onTabChanged({ tab }) {
      // This is necessary to force the yamlEditor to adjust the size once it has space to fill.
      if (tab.name === 'parameters' && this.$refs.yamlEditor?.refresh) {
        this.$refs.yamlEditor.refresh();
      }
    },
    selectTemplateSubtype(subType) {
      this.value.kind = subType;
    }
  }
};
</script>
<template>
  <div>
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :selected-subtype="value.kind"
      :subtypes="templateSubtypes"
      :validation-passed="true"
      :errors="errors"
      @error="e=>errors = e"
      @finish="save"
      @select-type="selectTemplateSubtype"
    >
      <div v-if="value" class="gatekeeper-constraint">
        <div>
          <NameNsDescription
            v-if="!isView"
            :value="value"
            :mode="mode"
            :namespaced="false"
          />
        </div>
        <div class="spacer"></div>
        <div class="row mb-40">
          <div class="col span-12">
            <h3>Enforcement Action</h3>
            <RadioGroup
              v-model="value.spec.enforcementAction"
              name="enforcementAction"
              class="enforcement-action"
              :options="enforcementActionOptions"
              :labels="enforcementActionLabels"
              :mode="mode"
              @input="e=>value.spec.enforcementAction = e"
            />
          </div>
        </div>
        <div v-if="isView">
          <h2>{{ t('gatekeeperConstraint.violations.title') }}</h2>
          <GatekeeperViolationsTable :constraint="value" />
          <div class="spacer"></div>
        </div>
        <Tabbed :side-tabs="true" @changed="onTabChanged">
          <Tab name="parameters" :label="t('gatekeeperConstraint.tab.parameters.title')" :weight="3">
            <YamlEditor
              ref="yamlEditor"
              v-model="parametersYaml"
              class="yaml-editor"
              :editor-mode="editorMode"
              @newObject="$set(value.spec, 'parameters', $event)"
            />
          </Tab>
          <Tab name="rules" :label="t('gatekeeperConstraint.tab.rules.title')" :weight="2">
            <div class="row">
              <div class="col span-12">
                <h3>{{ t('gatekeeperConstraint.tab.rules.title') }}</h3>
                <MatchKinds v-model="value.spec.match.kinds" :mode="mode" />
              </div>
            </div>
            <div class="row mt-40">
              <div class="col span-12">
                <h3>{{ t('gatekeeperConstraint.tab.rules.sub.labelSelector.title') }}</h3>
                <RuleSelector
                  v-model="value.spec.match.labelSelector.matchExpressions"
                  :add-label="t('gatekeeperConstraint.tab.rules.sub.labelSelector.addLabel')"
                  :mode="mode"
                />
              </div>
            </div>
          </Tab>
          <Tab name="namespaces" :label="t('gatekeeperConstraint.tab.namespaces.title')" :weight="1">
            <div class="row">
              <div class="col span-6">
                <h3>{{ t('gatekeeperConstraint.tab.namespaces.sub.scope.title') }}</h3>
                <Scope v-model="value.spec.match.scope" :mode="mode" />
              </div>
            </div>
            <div class="row mt-40">
              <div class="col span-12">
                <h3>{{ t('gatekeeperConstraint.tab.namespaces.sub.namespaces') }}</h3>
                <NamespaceList v-model="value.spec.match.namespaces" :mode="mode" :namespace-filter="NAMESPACE_FILTERS.nonSystem" add-label="Add Namespace" />
              </div>
            </div>
            <div class="row mt-40">
              <div class="col span-12">
                <h3>{{ t('gatekeeperConstraint.tab.namespaces.sub.excludedNamespaces') }}</h3>
                <NamespaceList v-model="value.spec.match.excludedNamespaces" :mode="mode" add-label="Add Excluded Namespace" />
              </div>
            </div>
            <div class="row mt-40">
              <div class="col span-12">
                <h3>{{ t('gatekeeperConstraint.tab.namespaces.sub.namespaceSelector.title') }}</h3>
                <RuleSelector
                  v-model="value.spec.match.namespaceSelector.matchExpressions"
                  add-label="Add Namespace Selector"
                  :mode="mode"
                />
              </div>
            </div>
          </Tab>
        </Tabbed>
      </div>
    </CruResource>
  </div>
</template>

<style lang="scss">
.gatekeeper-constraint {
  .enforcement-action {
    max-width: 200px;
  }
}

</style>
