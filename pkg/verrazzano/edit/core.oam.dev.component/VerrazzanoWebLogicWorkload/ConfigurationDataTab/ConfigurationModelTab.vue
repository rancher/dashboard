<script>
// Added by Verrazzano
import LabeledSelect from '@shell/components/form/LabeledSelect';
import OnlineUpdatesTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ConfigurationDataTab/OnlineUpdatesTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';
import AuxiliaryImagesTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ConfigurationDataTab/AuxiliaryImagesTab';

import { CONFIG_MAP, SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'ConfigurationModel',
  components: {
    LabeledSelect,
    OnlineUpdatesTab,
    TabDeleteButton,
    TreeTab,
    AuxiliaryImagesTab,
  },
  mixins: [WebLogicWorkloadHelper],
  props:  {
    value: {
      type:    Object,
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
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
    weight: {
      type:    Number,
      default: 0,
    },
  },
  data() {
    return {
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata.namespace,
      allSecrets:      {},
      allConfigMaps:   {},
      secrets:         [],
      configMaps:      [],
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
    domainTypeOptions() {
      return [
        { value: 'WLS', label: this.t('verrazzano.weblogic.types.domainType.wls') },
        { value: 'JRF', label: this.t('verrazzano.weblogic.types.domainType.jrf') },
      ];
    }
  },
  methods: {
    resetSecretsAndConfigMaps() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
        this.configMaps = this.allConfigMaps[this.namespace] || [];
      }
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.model');
    }
  },
  watch: {
    fetchInProgress() {
      this.resetSecretsAndConfigMaps();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecretsAndConfigMaps();
    },
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :weight="weight">
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
            <LabeledSelect
              :value="getField('domainType')"
              :mode="mode"
              :options="domainTypeOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'domainType')"
              :label="t('verrazzano.weblogic.fields.configuration.model.domainType')"
              @input="setFieldIfNotEmpty('domainType', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledSelect
              :value="getField('runtimeEncryptionSecret')"
              :mode="mode"
              required
              :options="secrets"
              option-label="metadata.name"
              :reduce="secret => secret.metadata.name"
              :placeholder="getNotSetPlaceholder(value, 'runtimeEncryptionSecret')"
              :label="t('verrazzano.weblogic.fields.configuration.model.runtimeEncryptionSecret')"
              @input="setFieldIfNotEmpty('runtimeEncryptionSecret', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledSelect
              :value="getField('configMap')"
              :mode="mode"
              :options="configMaps"
              option-label="metadata.name"
              :reduce="configMap => configMap.metadata.name"
              :placeholder="getNotSetPlaceholder(value, 'configMap')"
              :label="t('verrazzano.weblogic.fields.configuration.model.configMap')"
              @input="setFieldIfNotEmpty('configMap', $event)"
            />
          </div>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <OnlineUpdatesTab
        :value="getField('onlineUpdate')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'onlineUpdate')"
        :weight="2"
        @input="setFieldIfNotEmpty('onlineUpdate', $event)"
        @delete="setField('onlineUpdate', undefined)"
      />

      <AuxiliaryImagesTab
        :value="getListField('auxiliaryImages')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'auxiliaryImages')"
        :weight="1"
        @input="setFieldIfNotEmpty('auxiliaryImages', $event)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
