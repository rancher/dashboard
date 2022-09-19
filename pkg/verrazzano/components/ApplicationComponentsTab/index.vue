<script>
// Added by Verrazzano
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import IngressTraitTab from '@pkg/components/ApplicationComponentsTab/IngressTraitTab';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LoggingTraitTab from '@pkg/components/ApplicationComponentsTab/LoggingTraitTab';
import ManualScalerTraitTab from '@pkg/components/ApplicationComponentsTab/ManualScalerTraitTab';
import MetricsTraitTab from '@pkg/components/ApplicationComponentsTab/MetricsTraitTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { VZ_COMPONENT } from '@pkg/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'ApplicationComponentsTab',
  components: {
    IngressTraitTab,
    LabeledInput,
    LabeledSelect,
    LoggingTraitTab,
    ManualScalerTraitTab,
    MetricsTraitTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true,
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    return {
      treeTabName:          this.tabName,
      treeTabLabel:         this.tabLabel,
      fetchInProgress:      true,
      namespace:            this.namespacedObject.metadata?.namespace,
      allComponents:        {},
      namespacedComponents: [],
      newName:              '',
      newTraitType:         '',
    };
  },
  async fetch() {
    const requests = {};

    if (this.$store.getters['cluster/schemaFor'](VZ_COMPONENT)) {
      requests.components = this.$store.dispatch('management/findAll', { type: VZ_COMPONENT });
    }

    const hash = await allHash(requests);

    if (hash.components) {
      this.sortObjectsByNamespace(hash.components, this.allComponents);
    }
    this.fetchInProgress = false;
  },
  computed: {
    traitTypeOptions() {
      return [
        { value: 'IngressTrait', label: this.t('verrazzano.common.types.trait.ingress') },
        { value: 'LoggingTrait', label: this.t('verrazzano.common.types.trait.logging') },
        { value: 'ManualScalerTrait', label: this.t('verrazzano.common.types.trait.manualScaler') },
        { value: 'MetricsTrait', label: this.t('verrazzano.common.types.trait.metrics') },
      ];
    },
    availableComponents() {
      const usedComponentNames = this.dynamicListChildren.map(component => component.componentName);

      return this.namespacedComponents.filter(component => !usedComponentNames.includes(component.metadata.name));
    },
  },
  methods: {
    getDynamicListTabName(child) {
      return this.createTabName(this.treeTabName, child?.componentName);
    },
    resetComponents() {
      this.namespacedComponents = this.allComponents[this.namespace] || [];
    },
    addComponent() {
      if (this.newName) {
        this.dynamicListAddChild({ componentName: this.newName, traits: [] });
        this.newName = '';
      }
    },
    getAvailableTraitTypes(component) {
      const usedTraitTypes = component.traits?.map(trait => trait.trait.kind) || [];

      return this.traitTypeOptions.filter(traitType => !usedTraitTypes.includes(traitType.value));
    },
    getTraitApiVersion(traitType) {
      let apiVersion;

      switch (traitType) {
      case 'IngressTrait':
        apiVersion = this.ingressTraitApiVersion;
        break;

      case 'LoggingTrait':
        apiVersion = this.loggingTraitApiVersion;
        break;

      case 'ManualScalerTrait':
        apiVersion = this.manualScalerTraitApiVersion;
        break;

      case 'MetricsTrait':
        apiVersion = this.metricsTraitApiVersion;
        break;
      }

      return apiVersion;
    },
    addTrait(component) {
      if (this.newTraitType) {
        if (!component.traits) {
          component.traits = [];
        }
        component.traits.push({
          trait: {
            apiVersion: this.getTraitApiVersion(this.newTraitType),
            kind:       this.newTraitType,
            spec:       { },
          }
        });
        this.newTraitType = '';
        this.queueUpdate();
      }
    },
    getIngressTrait(component) {
      return (component.traits || []).find(t => t.trait.kind === 'IngressTrait');
    },
    getLoggingTrait(component) {
      return (component.traits || []).find(t => t.trait.kind === 'LoggingTrait');
    },
    getManualScalerTrait(component) {
      return (component.traits || []).find(t => t.trait.kind === 'ManualScalerTrait');
    },
    getMetricsTrait(component) {
      return (component.traits || []).find(t => t.trait.kind === 'MetricsTrait');
    },
    removeTrait(component, traitType) {
      const index = (component.traits || []).findIndex(t => t.trait.kind === traitType);

      if (index !== -1) {
        component.traits.splice(index, 1);
        this.queueUpdate();
      }
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.components');
    }
  },
  watch: {
    fetchInProgress() {
      this.resetComponents();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetComponents();
    }
  },
};
</script>

<template>
  <TreeTab
    :label="t('verrazzano.common.tabs.components')"
    name="components"
    :show-nav-children="true"
  >
    <template #default>
      <div v-if="!isView" class="row">
        <div class="col span-4">
          <LabeledSelect
            v-model="newName"
            :mode="mode"
            :options="availableComponents"
            option-label="metadata.name"
            :reduce="component => component.metadata.name"
            :label="t('verrazzano.common.fields.newComponentName')"
          />
        </div>
        <div class="col span-4">
          <button
            type="button"
            class="btn role-tertiary add"
            data-testid="add-item"
            :disabled="isView"
            @click="addComponent()"
          >
            {{ t('verrazzano.common.buttons.addComponent') }}
          </button>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab
        v-for="(component, idx) in dynamicListChildren"
        :key="component._id"
        :label="component.componentName"
        :title="t('verrazzano.common.titles.component')"
        :name="getDynamicListTabName(component)"
      >
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.common.titles.component')"
            :button-label="t('verrazzano.common.messages.removeComponentFromApplication')"
            :mode="mode"
            @click="dynamicListDeleteChildByIndex(idx)"
          />
        </template>
        <template #default>
          <div>
            <div class="row">
              <div class="col span-6">
                <LabeledInput
                  :value="component.componentName"
                  :mode="mode"
                  required
                  disabled
                  :label="t('verrazzano.common.fields.componentName')"
                />
              </div>
            </div>
            <div v-if="!isView">
              <div class="spacer-small" />
              <div class="row">
                <div class="col span-6">
                  <LabeledSelect
                    v-model="newTraitType"
                    :mode="mode"
                    :options="getAvailableTraitTypes(component)"
                    option-key="value"
                    option-label="label"
                    :label="t('verrazzano.common.fields.newTraitType')"
                  />
                </div>
                <div class="col span-6">
                  <button
                    type="button"
                    class="btn role-tertiary add"
                    data-testid="add-item"
                    @click="addTrait(component)"
                  >
                    {{ t('verrazzano.common.buttons.addTrait') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #nestedTabs>
          <IngressTraitTab
            v-if="getIngressTrait(component)"
            :value="getIngressTrait(component)"
            :mode="mode"
            :namespaced-object="namespacedObject"
            :tab-name="createTabName(getDynamicListTabName(component), 'ingressTrait')"
            @deleteTrait="removeTrait(component, $event)"
            @input="dynamicListUpdate"
          />
          <LoggingTraitTab
            v-if="getLoggingTrait(component)"
            :value="getLoggingTrait(component)"
            :mode="mode"
            :tab-name="createTabName(getDynamicListTabName(component), 'loggingTrait')"
            @deleteTrait="removeTrait(component, $event)"
            @input="dynamicListUpdate"
          />
          <ManualScalerTraitTab
            v-if="getManualScalerTrait(component)"
            :value="getManualScalerTrait(component)"
            :mode="mode"
            :tab-name="createTabName(getDynamicListTabName(component), 'manualScalerTrait')"
            @deleteTrait="removeTrait(component, $event)"
            @input="dynamicListUpdate"
          />
          <MetricsTraitTab
            v-if="getMetricsTrait(component)"
            :value="getMetricsTrait(component)"
            :mode="mode"
            :namespaced-object="namespacedObject"
            :tab-name="createTabName(getDynamicListTabName(component), 'metricsTrait')"
            @deleteTrait="removeTrait(component, $event)"
            @input="dynamicListUpdate"
          />
        </template>
      </TreeTab>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
