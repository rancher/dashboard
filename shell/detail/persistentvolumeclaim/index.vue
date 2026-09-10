<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import { POD } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  name: 'DetailPersistentVolumeClaim',

  components: {
    Loading,
    Tab,
    ResourceTabs,
    ResourceTable,
  },

  mixins: [CreateEditView],

  async fetch() {
    if (this.podSchema) {
      this.mountedPods = await this.value.fetchMountedPods();
    }
  },

  data() {
    return { mountedPods: [] };
  },

  computed: {
    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },

    podHeaders() {
      return this.$store.getters['type-map/headersFor'](this.podSchema).filter((h) => !h.name || h.name !== NAMESPACE_COL.name);
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTabs :value="value">
      <Tab
        v-if="podSchema"
        name="mounted-pods"
        :label="t('persistentVolumeClaim.detail.pods.label')"
        :weight="3"
      >
        <p
          v-if="mountedPods.length === 0"
          class="caption"
        >
          {{ t('persistentVolumeClaim.detail.pods.none') }}
        </p>
        <p
          v-else
          class="caption"
        >
          {{ t('persistentVolumeClaim.detail.pods.caption') }}
        </p>
        <ResourceTable
          v-if="mountedPods.length > 0"
          :rows="mountedPods"
          :headers="podHeaders"
          key-field="id"
          :schema="podSchema"
          :namespaced="false"
          :groupable="false"
          :search="false"
          :table-actions="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.caption {
  margin-bottom: .5em;
}
</style>
