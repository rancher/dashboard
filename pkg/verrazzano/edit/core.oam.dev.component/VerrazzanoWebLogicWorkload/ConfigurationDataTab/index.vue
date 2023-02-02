<script>
// Added by Verrazzano
import ConfigurationModelTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ConfigurationDataTab/ConfigurationModelTab';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import OpssConfigurationTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload//ConfigurationDataTab/OpssConfigurationTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

import { CONFIG_MAP, SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'ConfigurationDataTab',
  components: {
    ConfigurationModelTab,
    LabeledInput,
    LabeledSelect,
    OpssConfigurationTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [WebLogicWorkloadHelper],
  props:  {
    value: {
      type:     Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    templateObject: {
      type:     Object,
      required: true,
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const domainHomeSourceType = this.get(this.templateObject, 'spec.domainHomeSourceType');

    return {
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
      fetchInProgress: true,
      isLoading:       true,
      namespace:       this.namespacedObject.metadata?.namespace,
      allSecrets:      {},
      allConfigMaps:   {},
      secrets:         [],
      configMaps:      [],
      domainHomeSourceType,
    };
  },
  async fetch() {
    this.allSecrets = {};

    const requests = { secrets: this.$store.dispatch('management/findAll', { type: SECRET }) };

    if (this.$store.getters['cluster/schemaFor'](CONFIG_MAP)) {
      requests.configMaps = this.$store.dispatch('management/findAll', { type: CONFIG_MAP });
    }

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    if (hash.configMaps) {
      this.sortObjectsByNamespace(hash.configMaps, this.allConfigMaps);
    }
    this.fetchInProgress = false;
  },
  computed: {
    overrideDistributionStrategyOptions() {
      return [
        { value: 'DYNAMIC', label: this.t('verrazzano.weblogic.types.overrideDistributionStrategy.dynamic') },
        { value: 'ON_RESTART', label: this.t('verrazzano.weblogic.types.overrideDistributionStrategy.onRestart') },
      ];
    },
    showModelTab() {
      return this.domainHomeSourceType === 'FromModel';
    }
  },
  methods: {
    resetSecretsAndConfigMaps() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
        this.configMaps = this.allConfigMaps[this.namespace] || [];
      }
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.configuration');
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    fetchInProgress() {
      this.resetSecretsAndConfigMaps();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecretsAndConfigMaps();
    },
    'templateObject.spec.domainHomeSourceType'(neu, old) {
      if (!this.isLoading) {
        this.domainHomeSourceType = neu;
      }
    },
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('introspectorJobActiveDeadlineSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'introspectorJobActiveDeadlineSeconds')"
              :label="t('verrazzano.weblogic.fields.introspectorJobActiveDeadlineSeconds')"
              @input="setNumberField('introspectorJobActiveDeadlineSeconds', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('overrideDistributionStrategy')"
              :mode="mode"
              :options="overrideDistributionStrategyOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'overrideDistributionStrategy')"
              :label="t('verrazzano.weblogic.fields.overrideDistributionStrategy')"
              @input="setFieldIfNotEmpty('overrideDistributionStrategy', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('overridesConfigMap')"
              :mode="mode"
              :options="configMaps"
              option-label="metadata.name"
              :reduce="configMap => configMap.metadata.name"
              :placeholder="getNotSetPlaceholder(value, 'overridesConfigMap')"
              :label="t('verrazzano.weblogic.fields.overridesConfigMap')"
              @input="setFieldIfNotEmpty('overridesConfigMap', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <LabeledSelect
            :value="getListField('secrets')"
            :mode="mode"
            :multiple="true"
            :taggable="true"
            :options="secrets"
            option-label="metadata.name"
            :reduce="secret => secret.metadata.name"
            :placeholder="getNotSetPlaceholder(value, 'secrets')"
            :label="t('verrazzano.common.fields.secrets')"
            @input="setFieldIfNotEmpty('secrets', $event)"
          />
        </div>
      </div>
    </template>

    <!--

    -->
    <template #nestedTabs>
      <ConfigurationModelTab
        v-if="showModelTab"
        :value="getField('model')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'model')"
        :weight="1"
        @input="setFieldIfNotEmpty('model', $event)"
        @delete="setField('model', undefined)"
      />
      <OpssConfigurationTab
        :value="getField('opss')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'opss')"
        :weight="3"
        @input="setFieldIfNotEmpty('opss', $event)"
        @delete="setField('opss', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
