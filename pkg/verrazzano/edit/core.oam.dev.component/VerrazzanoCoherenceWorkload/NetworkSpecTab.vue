<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import HostAliasesTab from '@pkg/components/HostAliasesTab';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import PodDNSConfig from '@pkg/components/PodSpecTab/PodDNSConfig';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'NetworkSpecTab',
  components: {
    Checkbox,
    HostAliasesTab,
    LabeledInput,
    LabeledSelect,
    PodDNSConfig,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      default: 'create'
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: '',
    }
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.network');
    }
  }
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
      <div class="row">
        <div class="col span-4">
          <Checkbox
            :value="getField('hostNetwork')"
            :mode="mode"
            :label="t('verrazzano.common.fields.podSpec.hostNetwork')"
            @input="setBooleanField('hostNetwork', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('setHostnameAsFQDN')"
            :mode="mode"
            :label="t('verrazzano.common.fields.podSpec.setHostnameAsFQDN')"
            @input="setBooleanField('setHostnameAsFQDN', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('hostname')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'hostname')"
            :label="t('verrazzano.common.fields.podSpec.hostname')"
            @input="setFieldIfNotEmpty('hostname', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('subdomain')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'subdomain')"
            :label="t('verrazzano.common.fields.podSpec.subdomain')"
            @input="setFieldIfNotEmpty('subdomain', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('dnsPolicy')"
            :mode="mode"
            :options="dnsPolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'dnsPolicy')"
            :label="t('verrazzano.common.fields.podSpec.dnsPolicy')"
            @input="setFieldIfNotEmpty('dnsPolicy', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab :name="createTabName(treeTabName, 'dnsConfig')" :label="t('verrazzano.coherence.tabs.dnsConfig')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.coherence.tabs.dnsConfig')"
            :mode="mode"
            @click="setField('dnsConfig', undefined)"
          />
        </template>
        <template #default>
          <PodDNSConfig
            :value="getField('dnsConfig')"
            :mode="mode"
            @input="setFieldIfNotEmpty('dnsConfig', $event)"
          />
        </template>
      </TreeTab>
      <HostAliasesTab
        :value="getListField('hostAliases')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'hostAliases')"
        @input="setFieldIfNotEmpty('hostAliases', $event)"
      />
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
