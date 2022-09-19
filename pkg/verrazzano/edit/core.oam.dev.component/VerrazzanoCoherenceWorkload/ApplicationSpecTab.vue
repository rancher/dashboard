<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'ApplicationSpecTab',
  components: {
    Checkbox,
    LabeledArrayList,
    LabeledInput,
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
    return {
      treeTabName:   this.tabName,
      treeTabLabel:  this.tabLabel,
    };
  },
  computed: {
    cloudNativeBuildPackEnabled() {
      const result = this.getField('cloudNativeBuildPack.enabled');

      return result ? Boolean(result) : false;
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.application');
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
      <div>
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('type')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'type')"
              :label="t('verrazzano.coherence.fields.applicationType')"
              @input="setFieldIfNotEmpty('type', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('main')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'main')"
              :label="t('verrazzano.coherence.fields.applicationMain')"
              @input="setFieldIfNotEmpty('main', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('workingDir')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'workingDir')"
              :label="t('verrazzano.common.fields.workingDir')"
              @input="setFieldIfNotEmpty('workingDir', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-6">
            <LabeledArrayList
              :value="getListField('args')"
              :mode="mode"
              :value-label="t('verrazzano.coherence.fields.appArg')"
              :add-label="t('verrazzano.coherence.buttons.addAppArg')"
              @input="setFieldIfNotEmpty('args', $event)"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              :value="getField('springBootFatJar')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'springBootFatJar')"
              :label="t('verrazzano.coherence.fields.springBootFatJar')"
              @input="setFieldIfNotEmpty('springBootFatJar', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-6">
            <div class="spacer-small" />
            <Checkbox
              :value="getField('cloudNativeBuildPack.enabled')"
              :mode="mode"
              :label="t('verrazzano.coherence.fields.cloudNativeBuildPack.enabled')"
              @input="setBooleanField('cloudNativeBuildPack.enabled', $event)"
            />
          </div>
          <div v-if="cloudNativeBuildPackEnabled" class="col span-6">
            <LabeledInput
              :value="getField('cloudNativeBuildPack.launcher')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'cloudNativeBuildPack.launcher')"
              :label="t('verrazzano.coherence.fields.cloudNativeBuildPack.launcher')"
              @input="setFieldIfNotEmpty('cloudNativeBuildPack.launcher', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
