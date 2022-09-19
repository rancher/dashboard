<script>
// Added by Verrazzano
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';

import Labels from '@pkg/components/LabelsTab/Labels';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NamespaceTab',
  components: {
    LabeledArrayList,
    LabeledInput,
    Labels,
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
  methods: {
    deleteNamespace() {
      this.$emit('delete', this.value);
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.metadata?.name || this.t('verrazzano.common.tabs.namespace');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="t('verrazzano.common.tabs.namespace')"
        :mode="mode"
        @click="deleteNamespace()"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('metadata.name')"
            :mode="mode"
            readonly
            :placeholder="getNotSetPlaceholder(value, 'metadata.name')"
            :label="t('verrazzano.common.fields.name')"
            @input="setFieldIfNotEmpty('metadata.name', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div>
        <Labels
          :value="getField('metadata')"
          :mode="mode"
          @input="setFieldIfNotEmpty('metadata', $event)"
        />
      </div>
      <div class="spacer" />
      <div>
        <h3>{{ t('verrazzano.common.titles.finalizers') }}</h3>
        <LabeledArrayList
          :value="getListField('spec.finalizers')"
          :mode="mode"
          :value-label="t('verrazzano.common.fields.finalizer')"
          :add-label="t('verrazzano.common.buttons.addFinalizer')"
          @input="setFieldIfNotEmpty('spec.finalizers', $event)"
        />
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
