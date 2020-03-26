<script>
import { _VIEW } from '../config/query-params';
import { SCHEMA } from '@/config/types';
import MatchKinds from '@/components/form/MatchKinds';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import KeyValue from '@/components/form/KeyValue';
import LabeledSelect from '@/components/form/LabeledSelect';
import NamespaceList from '@/components/form/NamespaceList';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import Footer from '@/components/form/Footer';
import GatekeeperViolationsTable from '@/components/GatekeeperViolationsTable';
import RuleSelector from '@/components/form/RuleSelector';
import RadioGroup from '@/components/form/RadioGroup';
import { ucFirst } from '@/utils/string';

function findConstraintTypes(schemas) {
  return schemas
    .filter(schema => schema?.attributes?.group === 'constraints.gatekeeper.sh')
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
    Tabbed
  },

  extends: CreateEditView,

  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  data() {
    const schemas = this.$store.getters['cluster/all'](SCHEMA);
    const constraintTypes = findConstraintTypes(schemas);
    const templateOptions = constraintTypes.map((type) => {
      return {
        label: type.replace(CONSTRAINT_PREFIX, ''),
        value: type
      };
    });

    const localValue = Object.keys(this.value).length > 0
      ? { ...this.value }
      : {
        type:  templateOptions[0].value,
        spec: {
          parameters: {},
          match:      {
            kinds:              [{ apiGroups: [''] }],
            namespaces:         [],
            excludedNamespaces: [],
            labelSelector:      { matchExpressions: [] },
            namespaceSelector:  { matchExpressions: [] }
          }
        }
      };

    localValue.spec.match.kinds = (localValue?.spec?.match?.kinds || []).length === 0
      ? [{ apiGroups: [''] }]
      : localValue.spec.match.kinds;

    const extraDetailColumns = [
      {
        title:   'Template',
        content: templateOptions.find(o => o.value === localValue.type).label
      }
    ];

    return {
      localValue,
      templateOptions,
      extraDetailColumns,
      enforcementActionOptions: Object.values(ENFORCEMENT_ACTION_VALUES),
      enforcementActionLabels:  Object.values(ENFORCEMENT_ACTION_VALUES).map(ucFirst)
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
  },

  watch: {
    localValue: {
      handler(value) {
        // We have to set the type for the CreateEditView mixin to know what the type is when creating
        this.type = value.type;
      },
      deep: true
    }
  },

  created() {
    (async() => {
      const value = this.value.save
        ? this.value
        : Object.assign(await this.$store.dispatch('cluster/create', { type: this.templateOptions[0].value }), this.value);

      value.type = value.type || this.templateOptions[0].value;
      value.spec = value.spec || {};
      value.spec.enforcementAction = value.spec.enforcementAction || ENFORCEMENT_ACTION_VALUES.DENY;
      value.spec.parameters = value.spec.parameters || {};
      value.spec.match = value.spec.match || {};
      value.spec.match.kinds = value.spec.match.kinds || [];
      value.spec.match.namespaces = value.spec.match.namespaces || [];
      value.spec.match.excludedNamespaces = value.spec.match.excludedNamespaces || [];
      value.spec.match.labelSelector = value.spec.match.labelSelector || {};
      value.spec.match.labelSelector.matchExpressions = value.spec.match.labelSelector.matchExpressions || [];
      value.spec.match.namespaceSelector = value.spec.match.namespaceSelector || {};
      value.spec.match.namespaceSelector.matchExpressions = value.spec.match.namespaceSelector.matchExpressions || [];

      this.$emit('input', value);
    })();
  },

  methods: {
    done() {
      this.$router.replace({
        name:   'c-cluster-gatekeeper-constraints',
        params: this.$route.params
      });
    }
  }
};
</script>
<template>
  <div>
    <div>
      <NameNsDescription :value="value" :mode="mode" :namespaced="false" :extra-columns="['template']" :extra-detail-columns="extraDetailColumns">
        <template v-slot:template>
          <LabeledSelect
            :mode="mode"
            :value="localValue.type"
            :options="templateOptions"
            label="Template"
            @input="$set(localValue, 'type', $event)"
          />
        </template>
      </NameNsDescription>
    </div>
    <br />
    <div v-if="isView">
      <h2>Violations</h2>
      <GatekeeperViolationsTable :constraint="localValue" />
      <br />
    </div>
    <div>
      <h2>Parameters</h2>
      <KeyValue
        v-model="localValue.spec.parameters"
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
        v-model="localValue.spec.enforcementAction"
        class="enforcement-action"
        :options="enforcementActionOptions"
        :labels="enforcementActionLabels"
        :mode="mode"
        @input="e=>localValue.spec.enforcementAction = e"
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
              <NamespaceList v-model="localValue.spec.match.namespaces" :mode="mode" />
            </div>
            <div class="col span-6">
              <h4>Excluded Namespaces</h4>
              <NamespaceList v-model="localValue.spec.match.excludedNamespaces" :mode="mode" />
            </div>
          </div>
        </Tab>
        <Tab name="selectors" label="Selectors">
          <div class="row">
            <div class="col span-6">
              <h4>Label Selector</h4>
              <RuleSelector
                v-model="localValue.spec.match.labelSelector.matchExpressions"
                add-label="Add Label"
                :mode="mode"
              />
            </div>
            <div class="col span-6">
              <h4>Namespace Selector</h4>
              <RuleSelector
                v-model="localValue.spec.match.namespaceSelector.matchExpressions"
                add-label="Add Namespace"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>
        <Tab name="kinds" label="Kinds">
          <MatchKinds v-model="localValue.spec.match.kinds" :mode="mode" />
        </Tab>
      </Tabbed>
    </div>
    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </div>
</template>

<style lang="scss" scoped>
.enforcement-action {
  max-width: 200px;
}
</style>
