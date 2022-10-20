<script>
import { HCI } from '../types';
import { SCHEMA } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import Banner from '@components/Banner/Banner.vue';
import Loading from '@shell/components/Loading';
import MessageLink from '@shell/components/MessageLink';
import DeviceList from '../edit/kubevirt.io.virtualmachine/VirtualMachinePciDevices/DeviceList';

const schema = {
  id:         HCI.PCI_DEVICE,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.PCI_DEVICE,
    namespaced: false
  },
  metadata: { name: HCI.PCI_DEVICE },
};

export default {
  name: 'ListPciDevicePage',

  components: {
    Banner, DeviceList, Loading, MessageLink
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    this.hasSchema = this.$store.getters[`${ inStore }/schemaFor`](HCI.PCI_DEVICE);
    this.hasAddonSchema = this.$store.getters[`${ inStore }/schemaFor`](HCI.ADD_ONS);

    if (this.hasSchema) {
      try {
        const inStore = this.$store.getters['currentProduct'].inStore;

        const hash = await allHash({
          pcidevice:    this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.PCI_DEVICE }),
          addons:       this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.ADD_ONS }),
        });

        this.enabledPCI = hash.addons.find(addon => addon.name === 'pcidevices-controller')?.spec?.enabled === true;

        this.$store.dispatch('type-map/configureType', { match: HCI.PCI_DEVICE, isCreatable: this.enabledPCI });
      } catch (e) {}
    }
  },

  data() {
    return {
      enabledPCI: false,
      hasSchema:  false,
      to:         `${ HCI.ADD_ONS }/harvester-system/pcidevices-controller?mode=edit`
    };
  },

  computed: {
    schema() {
      return schema;
    },

    rows() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const rows = this.$store.getters[`${ inStore }/all`](HCI.PCI_DEVICE);

      return rows;
    }
  },

  typeDisplay() {
    return this.$store.getters['type-map/labelFor'](schema, 99);
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="!hasAddonSchema">
    <Banner color="warning">
      {{ t('harvester.pci.noPCIPermission') }}
    </Banner>
  </div>
  <DeviceList v-else-if="hasSchema && enabledPCI" :rows="rows" :schema="schema" />
  <div v-else>
    <Banner color="warning">
      <MessageLink
        :to="to"
        prefix-label="harvester.pci.goSetting.prefix"
        middle-label="harvester.pci.goSetting.middle"
        suffix-label="harvester.pci.goSetting.suffix"
      />
    </Banner>
  </div>
</template>
