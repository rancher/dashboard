<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'LoggingTraitTab',
  components: {
    LabeledInput,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:     Object,
      required: true
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
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.loggingTrait');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :button-label="t('verrazzano.common.messages.removeTypeFromComponent', { type: 'LoggingTrait' })"
        :mode="mode"
        @click="$emit('deleteTrait', 'LoggingTrait')"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-12">
          <LabeledInput
            :value="getField('trait.spec.loggingImage')"
            :mode="mode"
            required
            :placeholder="getNotSetPlaceholder(value, 'trait.spec.loggingImage')"
            :label="t('verrazzano.common.fields.loggingImage')"
            @input="setFieldIfNotEmpty('trait.spec.loggingImage', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-12">
          <LabeledInput
            :value="getField('trait.spec.loggingConfig')"
            :mode="mode"
            required
            type="multiline"
            :placeholder="getNotSetPlaceholder(value, 'trait.spec.loggingConfig')"
            :label="t('verrazzano.common.fields.loggingConfig')"
            @input="setFieldIfNotEmpty('trait.spec.loggingConfig', $event)"
          />
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
