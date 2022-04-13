<script>
import Vue from 'vue';
import merge from 'lodash/merge';
import { ucFirst } from '@shell/utils/string';
import { isSimpleKeyValue } from '@shell/utils/object';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { SCHEMA, NAMESPACE } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import RadioGroup from '@shell/components/form/RadioGroup';
import RuleSelector from '@shell/components/form/RuleSelector';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import CruResource from '@shell/components/CruResource';
import { ENFORCEMENT_ACTION_VALUES } from '@shell/models/constraints.gatekeeper.sh.constraint';
import { saferDump } from '@shell/utils/create-yaml';
import NamespaceList, { NAMESPACE_FILTERS_HELPER } from './NamespaceList';
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

    if (this.mode === _CREATE) {
      this.$set(this.value, 'spec', merge(this.value.spec, emptySpec));

      if (!this.value.spec.match.scope) {
        this.$set(this.value.spec.match, 'scope', SCOPE_OPTIONS[0].value);
      }
    } else {
      this.$set(this.value.spec, 'match', this.value.spec.match || {});
      this.$set(this.value.spec.match, 'kinds', this.value.spec.match.kinds || [{}]);
      this.$set(this.value.spec.match, 'labelSelector', this.value.spec.match.labelSelector || {});
      this.$set(this.value.spec.match.labelSelector, 'matchExpressions', this.value.spec.match.labelSelector.matchExpressions || []);
      this.$set(this.value.spec.match, 'namespaceSelector', this.value.spec.match.namespaceSelector || {});
      this.$set(this.value.spec.match.namespaceSelector, 'labelSelector', this.value.spec.match.namespaceSelector.labelSelector || []);
    }

    const parametersYaml = saferDump(this.value?.spec?.parameters);

    return {
      emptySpec,
      parametersYaml,
      enforcementActionOptions: [
        {
          label: `${ ENFORCEMENT_ACTION_VALUES.DENY } - deny admission requests with any violation`,
          value: ENFORCEMENT_ACTION_VALUES.DENY
        },
        {
          label: `${ ENFORCEMENT_ACTION_VALUES.DRYRUN } - enables constraints to be deployed in the cluster without making actual changes`,
          value: ENFORCEMENT_ACTION_VALUES.DRYRUN
        }
      ],
      enforcementActionLabels: Object.values(ENFORCEMENT_ACTION_VALUES).map(ucFirst),
      NAMESPACE_FILTERS_HELPER,
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
        const splitId = type.id.split('.');

        return {
          label:       type.id.replace(CONSTRAINT_PREFIX, ''),
          description: '',
          id:          splitId[splitId.length - 1],
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
    },
    showNamespaceLists() {
      return this.value.spec.match.scope !== 'Cluster';
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
      this.$set(this.value, 'kind', subType);
      this.$emit('set-subtype', subType);
    },
    onScopeChange(newScope) {
      if (newScope === 'Cluster') {
        this.value.spec.match.namespaces = [];
        this.value.spec.match.excludedNamespaces = [];
      }
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
            />
          </div>
        </div>
        <Tabbed :side-tabs="true" @changed="onTabChanged">
          <Tab name="namespaces" :label="t('gatekeeperConstraint.tab.namespaces.title')" :weight="3">
            <div class="row">
              <div class="col span-6">
                <Scope v-model="value.spec.match.scope" :mode="mode" @input="onScopeChange($event)" />
              </div>
            </div>
            <div v-if="showNamespaceLists" class="row mt-20">
              <div class="col span-12">
                <NamespaceList
                  v-model="value.spec.match.namespaces"
                  :label="t('gatekeeperConstraint.tab.namespaces.sub.namespaces')"
                  tooltip="If defined, a constraint will only apply to resources in a listed namespace."
                  :mode="mode"
                  :namespace-filter="NAMESPACE_FILTERS_HELPER.nonSystem"
                  add-label="Add Namespace"
                />
              </div>
            </div>
            <div v-if="showNamespaceLists" class="row mt-20">
              <div class="col span-12">
                <NamespaceList
                  v-model="value.spec.match.excludedNamespaces"
                  :label="t('gatekeeperConstraint.tab.namespaces.sub.excludedNamespaces')"
                  tooltip="If defined, a constraint will only apply to resources not in a listed namespace."
                  :mode="mode"
                  add-label="Add Excluded Namespace"
                />
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
          <Tab name="rules" :label="t('gatekeeperConstraint.tab.rules.title')" :weight="2">
            <div class="row">
              <div class="col span-12">
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
          <Tab name="parameters" :label="t('gatekeeperConstraint.tab.parameters.title')" :weight="1">
            <YamlEditor
              ref="yamlEditor"
              v-model="parametersYaml"
              class="yaml-editor"
              :editor-mode="editorMode"
              @newObject="$set(value.spec, 'parameters', $event)"
            />
          </Tab>
        </Tabbed>
      </div>
    </CruResource>
  </div>
</template>
