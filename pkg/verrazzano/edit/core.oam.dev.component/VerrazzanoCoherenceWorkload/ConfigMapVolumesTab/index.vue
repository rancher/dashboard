<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import ConfigMapVolumeTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/ConfigMapVolumesTab/ConfigMapVolumeTab';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

import { CONFIG_MAP } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'ConfigMapVolumesTab',
  components: {
    ConfigMapVolumeTab,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper, DynamicListHelper],
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
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata.namespace,
      allConfigMaps:   {},
      configMaps:      [],
      newName:         '',
    };
  },
  async fetch() {
    const requests = { configMaps: this.$store.dispatch('management/findAll', { type: CONFIG_MAP }) };

    const hash = await allHash(requests);

    if (hash.configMaps) {
      this.sortObjectsByNamespace(hash.configMaps, this.allConfigMaps);
    }
    this.fetchInProgress = false;
  },
  computed: {
    effectiveConfigMapOptions() {
      return this.configMaps.filter((configMap) => {
        const configMapName = configMap.metadata.name;
        const matchingElement = this.value.find((element) => {
          const volumeName = element.volumeName || element.name;

          return configMapName === volumeName;
        });

        return !matchingElement;
      });
    }
  },
  methods: {
    getDynamicListTabName(child) {
      return this.createTabName(this.treeTabName, child?.name);
    },
    resetConfigMaps() {
      if (!this.fetchInProgress) {
        this.configMaps = this.allConfigMaps[this.namespace] || [];
      }
    },
    addConfigMapVolume() {
      if (this.newName) {
        this.dynamicListAddChild({ name: this.newName });
        this.newName = '';
      }
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.configMapVolumes');
    }
  },
  watch: {
    fetchInProgress() {
      this.resetConfigMaps();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetConfigMaps();
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
        @click="dynamicListClearChildrenList"
      />
    </template>
    <template #default>
      <div>
        <div class="row">
          <div class="col span-4">
            <LabeledSelect
              v-model="newName"
              :mode="mode"
              :options="effectiveConfigMapOptions"
              option-label="metadata.name"
              :reduce="configMap => configMap.metadata.name"
              :label="t('verrazzano.coherence.fields.newConfigMapVolumeName')"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <button
              type="button"
              class="btn role-tertiary add"
              data-testid="add-item"
              :disabled="isView || !newName"
              @click="addConfigMapVolume"
            >
              {{ t('verrazzano.coherence.buttons.addConfigMapVolume') }}
            </button>
          </div>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <ConfigMapVolumeTab
        v-for="(configMapVolume, idx) in dynamicListChildren"
        :key="configMapVolume._id"
        :value="configMapVolume"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, configMapVolume.name)"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
