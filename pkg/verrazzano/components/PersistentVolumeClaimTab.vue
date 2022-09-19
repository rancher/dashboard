<script>
// Added by Verrazzano
import ContainerResourcesTab from '@pkg/components/ContainerResourcesTab';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabelSelectorTab from '@pkg/components/LabelSelectorTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TypedLocalObjectReference from '@pkg/components/TypedLocalObjectReference';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'PersistentVolumeClaimTab',
  components: {
    ContainerResourcesTab,
    LabeledInput,
    LabeledSelect,
    LabelSelectorTab,
    TabDeleteButton,
    TreeTab,
    TypedLocalObjectReference,
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
    readOnlyVolumeName: {
      type:    String,
      default: undefined
    },
    disableVolumeNameEditing: {
      type:    Boolean,
      default: false
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
  computed: {
    accessModes() {
      return [
        { value: 'ReadWriteOnce', label: this.t('verrazzano.common.types.accessModes.rwOnce') },
        { value: 'ReadOnlyMany', label: this.t('verrazzano.common.types.accessModes.roMany') },
        { value: 'ReadWriteMany', label: this.t('verrazzano.common.types.accessModes.rwMany') },
        { value: 'ReadWriteOncePod', label: this.t('verrazzano.common.types.accessModes.rwOncePod') },
      ];
    },
    volumeModes() {
      return [
        { value: 'Filesystem', label: this.t('verrazzano.common.types.volumeModes.filesystem') },
        { value: 'Block', label: this.t('verrazzano.common.types.volumeModes.block') },
      ];
    },
  },
  methods: {
    deleteDataSourceAndRef() {
      this.setField('dataSource', undefined);
      this.setField('dataSourceRef', undefined);
    },
    getVolumeName() {
      if (this.readOnlyVolumeName && this.disableVolumeNameEditing) {
        this.setField('volumeName', this.readOnlyVolumeName);
      }

      return this.getField('volumeName');
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.persistentVolumeClaim');
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
        <div class="col span-3">
          <LabeledInput
            :value="getVolumeName()"
            :mode="mode"
            :disabled="disableVolumeNameEditing"
            :placeholder="getNotSetPlaceholder(value, 'volumeName')"
            :label="t('verrazzano.common.fields.volumeName')"
            @input="setFieldIfNotEmpty('volumeName', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getField('volumeMode')"
            :mode="mode"
            :options="volumeModes"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'volumeMode')"
            :label="t('verrazzano.common.fields.volumeMode')"
            @input="setFieldIfNotEmpty('volumeMode', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            :value="getField('storageClassName')"
            :mode="mode"
            :placeholder="getNotSetPlaceholder(value, 'storageClassName')"
            :label="t('verrazzano.common.fields.storageClassName')"
            @input="setFieldIfNotEmpty('storageClassName', $event)"
          />
        </div>
        <div class="col span-3">
          <LabeledSelect
            :value="getListField('accessModes')"
            :mode="mode"
            :options="accessModes"
            option-key="value"
            option-label="label"
            multiple
            :placeholder="getNotSetPlaceholder(value, 'accessModes')"
            :label="t('verrazzano.common.fields.accessModes')"
            @input="setFieldIfNotEmpty('accessModes', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab
        :name="createTabName(treeTabName, 'dataSource')"
        :label="t('verrazzano.common.tabs.dataSource')"
      >
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.common.tabs.dataSource')"
            :mode="mode"
            @click="deleteDataSourceAndRef()"
          />
        </template>
        <template #default>
          <div>
            <TypedLocalObjectReference
              :value="getField('dataSource')"
              :mode="mode"
              @input="setFieldIfNotEmpty('dataSource', $event)"
            />
          </div>
          <div class="spacer" />
          <div>
            <h3>{{ t('verrazzano.common.titles.dataSourceRef') }}</h3>
            <TypedLocalObjectReference
              :value="getField('dataSourceRef')"
              :mode="mode"
              @input="setFieldIfNotEmpty('dataSourceRef', $event)"
            />
          </div>
        </template>
      </TreeTab>
      <ContainerResourcesTab
        :value="getField('resources')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'resources')"
        @input="setFieldIfNotEmpty('resources', $event)"
        @delete="setField('resources', undefined)"
      />
      <LabelSelectorTab
        :value="getField('selector')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'selector')"
        @input="setFieldIfNotEmpty('selector', $event)"
        @delete="setField('selector', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
