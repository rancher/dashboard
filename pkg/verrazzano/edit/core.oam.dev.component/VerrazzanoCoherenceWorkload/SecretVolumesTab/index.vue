<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretVolumeTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/SecretVolumesTab/SecretVolumeTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'SecretVolumesTab',
  components: {
    LabeledSelect,
    SecretVolumeTab,
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
      allSecrets:      {},
      secrets:         [],
      newName:         '',
    };
  },
  async fetch() {
    const requests = { secrets: this.$store.dispatch('management/findAll', { type: SECRET }) };

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    this.fetchInProgress = false;
  },
  computed: {
    effectiveSecretOptions() {
      return this.secrets.filter((secret) => {
        const secretName = secret.metadata.name;
        const matchingElement = this.value.find((element) => {
          const volumeName = element.volumeName || element.name;

          return secretName === volumeName;
        });

        return !matchingElement;
      });
    }
  },
  methods: {
    getDynamicListTabName(child) {
      return this.createTabName(this.treeTabName, child?.name);
    },
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
      }
    },
    addSecretVolume() {
      if (this.newName) {
        this.dynamicListAddChild({ name: this.newName });
        this.newName = '';
      }
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.secretVolumes');
    }
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
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
              :options="effectiveSecretOptions"
              option-label="metadata.name"
              :reduce="configMap => configMap.metadata.name"
              :label="t('verrazzano.coherence.fields.newSecretVolumeName')"
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
              @click="addSecretVolume"
            >
              {{ t('verrazzano.coherence.buttons.addSecretVolume') }}
            </button>
          </div>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <SecretVolumeTab
        v-for="(secretVolume, idx) in dynamicListChildren"
        :key="secretVolume._id"
        :value="secretVolume"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, secretVolume.name)"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
