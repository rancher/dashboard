<script>
// Added by Verrazzano
import AuxiliaryImage from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ConfigurationDataTab/AuxiliaryImagesTab/AuxiliaryImage';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';

export default {
  name:       'AuxiliaryImages',
  components: {
    ArrayListGrouped,
    AuxiliaryImage,
    TabDeleteButton,
    TreeTab,
    LabeledInput,
  },
  mixins: [WebLogicWorkloadHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
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
  },
  computed: {
    auxiliaryImageVolumeMountPath: {
      get() {
        return this.get(this.namespacedObject, 'spec.workload.spec.template.spec.configuration.model.auxiliaryImageVolumeMountPath');
      },
      set(neu) {
        this.set(this.namespacedObject, 'spec.workload.spec.template.spec.configuration.model.auxiliaryImageVolumeMountPath', neu );
      },
    },
    auxiliaryImageVolumeMedium: {
      get() {
        return this.get(this.namespacedObject, 'spec.workload.spec.template.spec.configuration.model.auxiliaryImageVolumeMedium');
      },
      set(neu) {
        this.set(this.namespacedObject, 'spec.workload.spec.template.spec.configuration.model.auxiliaryImageVolumeMedium', neu );
      }
    },
    auxiliaryImageVolumeSizeLimit: {
      get() {
        return this.get(this.namespacedObject, 'spec.workload.spec.template.spec.configuration.model.auxiliaryImageVolumeSizeLimit');
      },
      set(neu) {
        this.set(this.namespacedObject, 'spec.workload.spec.template.spec.configuration.model.auxiliaryImageVolumeSizeLimit', neu );
      },
    },
    advancedTabLabel() {
      return this.t('verrazzano.weblogic.tabs.auxiliaryImageSettings');
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
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.auxiliaryImages');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel" :weight="weight">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="dynamicListClearChildrenList"
      />
    </template>
    <template #nestedTabs>
      <TreeTab name="advanced" :label="advancedTabLabel">
        <div>
          <div class="row">
            <div class="col span-2">
              <LabeledInput
                v-model="auxiliaryImageVolumeMountPath"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(namespacedObject,'verrazzano.common.fields.auxiliaryImageVolumeMountPath')"
                :label="t('verrazzano.common.fields.auxiliaryImageVolumeMountPath')"
              />
            </div>
            <div class="col span-2">
              <!-- auxiliaryImageVolumeMedium -->
              <LabeledInput
                v-model="auxiliaryImageVolumeMedium"
                type="Number"
                min="0"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(namespacedObject,'verrazzano.common.fields.auxiliaryImageVolumeMedium')"
                :label="t('verrazzano.common.fields.auxiliaryImageVolumeMedium')"
              />
            </div>
            <div class="col span-2">
              <LabeledInput
                v-model="auxiliaryImageVolumeSizeLimit"
                type="Number"
                min="0"
                :mode="mode"
                :placeholder="getNotSetPlaceholder(namespacedObject,'verrazzano.common.fields.auxiliaryImageVolumeSizeLimit')"
                :label="t('verrazzano.common.fields.auxiliaryImageVolumeSizeLimit')"
              />
            </div>
          </div>
        </div>
      </TreeTab>
    </template>
    <template #default>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-8">
          <ArrayListGrouped
            v-model="dynamicListChildren"
            :mode="mode"
            :default-add-value="{ }"
            :add-label="t('verrazzano.weblogic.buttons.addAuxiliaryImage')"
            @add="dynamicListAddChild({})"
          >
            <template #remove-button="removeProps">
              <button
                v-if="dynamicListShowRemoveButton"
                type="button"
                class="btn role-link close btn-sm"
                @click="dynamicListDeleteChildByIndex(removeProps.i)"
              >
                <i class="icon icon-2x icon-x" />
              </button>
              <span v-else />
            </template>
            <template #default="props">
              <div class="spacer-small" />
              <AuxiliaryImage
                :value="props.row.value"
                :mode="mode"
                :namespaced-object="namespacedObject"
                @input="dynamicListUpdate"
              />
            </template>
          </ArrayListGrouped>
        </div>
      </div>
      <div>
        <div v-if="dynamicListShowEmptyListMessage()">
          {{ t('verrazzano.weblogic.messages.noAuxiliaryImages') }}
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
