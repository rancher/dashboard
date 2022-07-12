<script>
import { mapGetters } from 'vuex';
import ResourceList from '@shell/components/ResourceList/index.vue';
import Import from '@shell/components/Import';
import { ELEMENTAL_DEFAULT_NAMESPACE } from '../../types';
import { ELEMENTAL_SCHEMA_IDS } from '@shell/config/elemental-types';

export default {
  name:       'ListElementalResource',
  components: { ResourceList, Import },
  async fetch() {
    // needed to populate cluster name col on machine inventories list
    if (this.isMachineInv) {
      await this.$store.dispatch(`management/findAll`, { type: ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR });
    }
  },
  data() {
    return { ELEMENTAL_DEFAULT_NAMESPACE };
  },
  computed: {
    ...mapGetters(['currentCluster']),
    isMachineInv() {
      return this.$route.params.resource === ELEMENTAL_SCHEMA_IDS.MACHINE_INVENTORIES;
    },
    importEnabled() {
      return !!this.currentCluster?.actions?.apply;
    },
    advancedFilteringEnabled() {
      return !!this.isMachineInv;
    }
  },
  methods: {
    openImport() {
      this.$modal.show('importMachineInvModal');
    },

    closeImport() {
      this.$modal.hide('importMachineInvModal');
    },
  }
};
</script>

<template>
  <ResourceList :has-advanced-filtering="advancedFilteringEnabled">
    <template
      v-if="isMachineInv"
      slot="extraActions"
    >
      <button
        v-tooltip="t('elemental.machineInventory.import')"
        :disabled="!importEnabled"
        type="button"
        class="btn role-primary"
        @click="openImport()"
      >
        <i class="icon icon-upload icon-lg"></i>
      </button>
      <modal
        class="import-modal"
        name="importMachineInvModal"
        width="75%"
        height="auto"
        styles="max-height: 90vh;"
      >
        <Import
          :default-namespace="ELEMENTAL_DEFAULT_NAMESPACE"
          @close="closeImport"
        />
      </modal>
    </template>
  </ResourceList>
</template>
