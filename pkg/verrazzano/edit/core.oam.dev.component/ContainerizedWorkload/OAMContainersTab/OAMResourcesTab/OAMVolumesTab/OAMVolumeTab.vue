<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import ContainerizedWorkloadHelper from '@pkg/mixins/containerized-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'OAMVolume',
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [ContainerizedWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create',
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
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  computed: {
    accessModeOptions() {
      return [
        { value: 'RW', label: this.t('verrazzano.containerized.types.accessMode.rw') },
        { value: 'RO', label: this.t('verrazzano.containerized.types.accessMode.ro') },
      ];
    },
    sharingPolicyOptions() {
      return [
        { value: 'Exclusive', label: this.t('verrazzano.containerized.types.sharingPolicy.exclusive') },
        { value: 'Shared', label: this.t('verrazzano.containerized.types.sharingPolicy.shared') },
      ];
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.common.tabs.volume');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="t('verrazzano.common.tabs.volume')"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div>
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('name')"
              :mode="mode"
              required
              disabled
              :placeholder="getNotSetPlaceholder(value, 'name')"
              :label="t('verrazzano.containerized.fields.volume.name')"
              @input="setFieldIfNotEmpty('name', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('mountPath')"
              :mode="mode"
              required
              :placeholder="getNotSetPlaceholder(value, 'mountPath')"
              :label="t('verrazzano.containerized.fields.volume.mountPath')"
              @input="setFieldIfNotEmpty('mountPath', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledSelect
              :value="getField('accessMode')"
              :mode="mode"
              :options="accessModeOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'accessMode')"
              :label="t('verrazzano.containerized.fields.volume.accessMode')"
              @input="setFieldIfNotEmpty('accessMode', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledSelect
              :value="getField('sharingPolicy')"
              :mode="mode"
              :options="sharingPolicyOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'sharingPolicy')"
              :label="t('verrazzano.containerized.fields.volume.sharingPolicy')"
              @input="setFieldIfNotEmpty('sharingPolicy', $event)"
            />
          </div>
        </div>
        <div class="spacer" />
        <div>
          <h3>{{ t('verrazzano.containerized.titles.disk') }}</h3>
          <div class="row">
            <div class="col span-4">
              <LabeledInput
                :value="getField('disk.required')"
                :mode="mode"
                required
                :placeholder="getNotSetPlaceholder(value, 'disk.required')"
                :label="t('verrazzano.containerized.fields.requiredDisk')"
                @input="setFieldIfNotEmpty('disk.required', $event)"
              />
            </div>
            <div class="col span-4">
              <div class="spacer-small" />
              <Checkbox
                :value="getField('disk.ephemeral')"
                :mode="mode"
                :label="t('verrazzano.containerized.fields.ephemeral')"
                @input="setBooleanField('disk.ephemeral', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
