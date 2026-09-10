<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import { PVC } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  name: 'DetailPersistentVolume',

  components: {
    Loading,
    Tab,
    ResourceTabs,
    ResourceTable,
  },

  mixins: [CreateEditView],

  async fetch() {
    if (this.pvcSchema) {
      this.persistentVolumeClaim = await this.value.fetchPersistentVolumeClaim();
    }
  },

  data() {
    return { persistentVolumeClaim: null };
  },

  computed: {
    pvcSchema() {
      return this.$store.getters['cluster/schemaFor'](PVC);
    },

    pvcHeaders() {
      return this.$store.getters['type-map/headersFor'](this.pvcSchema).filter((h) => !h.name || h.name !== NAMESPACE_COL.name);
    },

    claims() {
      return this.persistentVolumeClaim ? [this.persistentVolumeClaim] : [];
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTabs :value="value">
      <Tab
        v-if="pvcSchema"
        name="volume-claim"
        :label="t('persistentVolume.detail.claim.label')"
        :weight="3"
      >
        <p
          v-if="claims.length === 0"
          class="caption"
        >
          {{ t('persistentVolume.detail.claim.none') }}
        </p>
        <p
          v-else
          class="caption"
        >
          {{ t('persistentVolume.detail.claim.caption') }}
        </p>
        <ResourceTable
          v-if="claims.length > 0"
          :rows="claims"
          :headers="pvcHeaders"
          key-field="id"
          :schema="pvcSchema"
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
