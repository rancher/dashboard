<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import KeyValue from '@shell/components/form/KeyValue';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SeccompProfile from '@pkg/components/SeccompProfile';
import SELinuxOptions from '@pkg/components/SELinuxOptions';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'PodSecurityContextTab',
  components: {
    Checkbox,
    KeyValue,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    SeccompProfile,
    SELinuxOptions,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  computed: {
    fsGroupChangePolicyOptions() {
      return [
        { value: 'Always', label: this.t('verrazzano.common.types.fsGroupChangePolicy.always') },
        { value: 'OnRootMismatch', label: this.t('verrazzano.common.types.fsGroupChangePolicy.onRootMismatch') },
      ];
    }
  },
  methods: {
    deleteSysctls() {
      this.setField('sysctls', undefined);
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.podSecurityContext');
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
            :value="getField('runAsNonRoot')"
            :mode="mode"
            :label="t('verrazzano.common.fields.podSecurityContext.runAsNonRoot')"
            @input="setBooleanField('runAsNonRoot', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-3">
          <LabeledInput
            :value="getField('runAsUser')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'runAsUser')"
            :label="t('verrazzano.common.fields.podSecurityContext.runAsUser')"
            @input="setNumberField('runAsUser', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('runAsGroup')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'runAsGroup')"
            :label="t('verrazzano.common.fields.podSecurityContext.runAsGroup')"
            @input="setNumberField('runAsGroup', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('fsGroup')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'fsGroup')"
            :label="t('verrazzano.common.fields.podSecurityContext.fsGroup')"
            @input="setNumberField('fsGroup', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('fsGroupChangePolicy')"
            :mode="mode"
            :options="fsGroupChangePolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'fsGroupChangePolicy')"
            :label="t('verrazzano.common.fields.podSecurityContext.fsGroupChangePolicy')"
            @input="setField('fsGroupChangePolicy', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledArrayList
            :value="getListField('supplementalGroups')"
            :mode="mode"
            value-type="Number"
            value-min="0"
            :value-label="t('verrazzano.common.fields.podSecurityContext.supplementalGroup')"
            :add-label="t('verrazzano.common.buttons.addSupplementalGroup')"
            @input="setFieldIfNotEmpty('supplementalGroups', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab :name="createTabName(treeTabName, 'sysctls')" :label="t('verrazzano.common.tabs.sysctls')">
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.common.tabs.sysctls')"
            :mode="mode"
            @click="deleteSysctls()"
          />
        </template>
        <template #default>
          <div class="row">
            <div class="col span-12">
              <KeyValue
                :value="getListField('sysctls')"
                :mode="mode"
                :key-label="t('verrazzano.common.fields.podSecurityContext.sysctl.key')"
                :value-label="t('verrazzano.common.fields.podSecurityContext.sysctl.value')"
                :add-label="t('verrazzano.common.buttons.addSysctl')"
                :read-allowed="false"
                @input="setFieldIfNotEmpty('sysctls', $event)"
              />
            </div>
          </div>
        </template>
      </TreeTab>
      <TreeTab :name="createTabName(treeTabName, 'seLinuxOptions')" :label="t('verrazzano.common.tabs.seLinuxOptions')">
        <SELinuxOptions
          :value="getField('seLinuxOptions')"
          :mode="mode"
          @input="setFieldIfNotEmpty('seLinuxOptions', $event)"
        />
      </TreeTab>
      <TreeTab :name="createTabName(treeTabName, 'seccompProfile')" :label="t('verrazzano.common.tabs.seccompProfile')">
        <SeccompProfile
          :value="getField('seccompProfile')"
          :mode="mode"
          @input="setFieldIfNotEmpty('seccompProfile', $event)"
        />
      </TreeTab>
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
