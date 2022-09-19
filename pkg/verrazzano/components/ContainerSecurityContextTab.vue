<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SELinuxOptions from '@pkg/components/SELinuxOptions';
import SeccompProfile from '@pkg/components/SeccompProfile';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ContainerSecurityContextTab',
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
    SELinuxOptions,
    SeccompProfile,
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
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const allCapabilities = [
      'ALL',
      'AUDIT_CONTROL',
      'AUDIT_WRITE',
      'BLOCK_SUSPEND',
      'CHOWN',
      'DAC_OVERRIDE',
      'DAC_READ_SEARCH',
      'FOWNER',
      'FSETID',
      'IPC_LOCK',
      'IPC_OWNER',
      'KILL',
      'LEASE',
      'LINUX_IMMUTABLE',
      'MAC_ADMIN',
      'MAC_OVERRIDE',
      'MKNOD',
      'NET_ADMIN',
      'NET_BIND_SERVICE',
      'NET_BROADCAST',
      'NET_RAW',
      'SETFCAP',
      'SETGID',
      'SETPCAP',
      'SETUID',
      'SYSLOGSYS_ADMIN',
      'SYS_BOOT',
      'SYS_CHROOT',
      'SYS_MODULE',
      'SYS_NICE',
      'SYS_PACCT',
      'SYS_PTRACE',
      'SYS_RAWIO',
      'SYS_RESOURCE',
      'SYS_TIME',
      'SYS_TTY_CONFIG',
      'WAKE_ALARM'
    ];

    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      allCapabilities,
    };
  },
  computed: {
    procMountOptions() {
      return [
        { value: 'DefaultProcMount', label: this.t('verrazzano.common.types.procMount.defaultProcMount') },
        { value: 'UnmaskedProcMount', label: this.t('verrazzano.common.types.procMount.unmaskedProcMount') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.containerSecurityContext');
    }
  },
  watch: {
    privileged(neu) {
      if (neu) {
        this.setField('allowPrivilegeEscalation', true);
      }
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
            :value="getField('allowPrivilegeEscalation')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerSecurityContext.allowPrivilegeEscalation')"
            @input="setBooleanField('allowPrivilegeEscalation', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('privileged')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerSecurityContext.privileged')"
            @input="setBooleanField('privileged', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('runAsNonRoot')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerSecurityContext.runAsNonRoot')"
            @input="setBooleanField('runAsNonRoot', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('readOnlyRootFilesystem')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerSecurityContext.readOnlyRootFilesystem')"
            @input="setBooleanField('readOnlyRootFilesystem', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('runAsUser')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'runAsUser')"
            :label="t('verrazzano.common.fields.containerSecurityContext.runAsUser')"
            @input="setFieldIfNotEmpty('runAsUser', $event)"
          />
          <div class="spacer-tiny" />
          <LabeledInput
            :value="getField('runAsGroup')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'runAsGroup')"
            :label="t('verrazzano.common.fields.containerSecurityContext.runAsGroup')"
            @input="setFieldIfNotEmpty('runAsGroup', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('procMount')"
            :mode="mode"
            :options="procMountOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'procMount')"
            :label="t('verrazzano.common.fields.containerSecurityContext.procMount')"
            @input="setFieldIfNotEmpty('procMount', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            :value="getField('capabilities.add')"
            :mode="mode"
            taggable
            multiple
            :close-on-select="false"
            :options="allCapabilities"
            :placeholder="getNotSetPlaceholder(value, 'capabilities.add')"
            :label="t('workload.container.security.addCapabilities')"
            @input="setFieldIfNotEmpty('capabilities.add', $event)"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            :value="getField('capabilities.drop')"
            :mode="mode"
            taggable
            multiple
            :close-on-select="false"
            :options="allCapabilities"
            :placeholder="getNotSetPlaceholder(value, 'runAsUser')"
            :label="t('workload.container.security.dropCapabilities')"
            @input="setFieldIfNotEmpty('capabilities.drop', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
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
