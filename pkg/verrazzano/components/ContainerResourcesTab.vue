<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ContainerResourcesTab',
  components: {
    LabeledInput,
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
      type:      String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: '',
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.resources');
    }
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
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('requests.cpu')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerResources.requestCpu')"
            @input="setField('requests.cpu', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('requests.memory')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerResources.requestMemory')"
            @input="setField('requests.memory', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('requests.ephemeral-storage')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerResources.requestEphemeralStorage')"
            @input="setField('requests.ephemeral-storage', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('limits.cpu')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerResources.limitCpu')"
            @input="setField('limits.cpu', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('limits.memory')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerResources.limitMemory')"
            @input="setField('limits.memory', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('limits.ephemeral-storage')"
            :mode="mode"
            :label="t('verrazzano.common.fields.containerResources.limitEphemeralStorage')"
            @input="setField('limits.ephemeral-storage', $event)"
          />
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
