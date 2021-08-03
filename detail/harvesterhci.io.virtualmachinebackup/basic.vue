<script>
import { HCI } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import CpuMemory from '@/edit/kubevirt.io.virtualmachine/CpuMemory';
import LabelValue from '@/components/LabelValue';

const UNDEFINED = 'n/a';

export default {
  name:       'Details',
  components: { CpuMemory, LabelValue },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true,
    },
    memory: {
      type:    String,
      default: ''
    }
  },

  data() {
    return { };
  },

  computed: {
    name() {
      return this.value?.metadata?.name || UNDEFINED;
    },

    hostname() {
      return this.value?.virtualMachineSpec?.template?.spec?.hostname;
    },

    imageName() {
      const imageList = this.$store.getters['virtual/all'](HCI.IMAGE) || [];
      const imageId = this.value?.virtualMachineSpec?.dataVolumeTemplates?.[0]?.metadata?.annotations?.['harvesterhci.io/imageId'] || '';
      const image = imageList.find( I => imageId === I.id);

      return image?.spec?.displayName || '-';
    },

    disks() {
      const disks = this.value?.virtualMachineSpec?.template?.spec?.domain?.devices?.disks || [];

      return disks.filter((disk) => {
        return !!disk.bootOrder;
      }).sort((a, b) => {
        if (a.bootOrder < b.bootOrder) {
          return -1;
        }

        return 1;
      });
    },

    cdroms() {
      const disks = this.value?.virtualMachineSpec?.template?.spec?.domain?.devices?.disks || [];

      return disks.filter((disk) => {
        return !!disk.cdrom;
      });
    },

    machineType() {
      return this.value?.virtualMachineSpec?.template?.spec?.domain?.machine?.type || undefined;
    }
  },

  methods: {
    getDeviceType(o) {
      if (o.disk) {
        return 'Disk';
      } else {
        return 'CD-ROM';
      }
    },
    isEmpty(o) {
      return o !== undefined && Object.keys(o).length === 0;
    }
  }
};
</script>

<template>
  <div class="overview-basics">
    <div class="row">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.name')" :value="name" />
      </div>

      <div class="col span-6">
        <LabelValue :name="t('harvester.fields.image')" :value="imageName" />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.hostname')" :value="hostname" />
      </div>

      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.input.MachineType')" :value="machineType" />
      </div>
    </div>

    <CpuMemory class="cpuMemory" :cpu="value.virtualMachineSpec.template.spec.domain.cpu.cores" :mode="mode" :memory="memory" />

    <div class="row">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.bootOrder')">
          <template #value>
            <div>
              <ul>
                <li v-for="(disk) in disks" :key="disk.bootOrder">
                  {{ disk.bootOrder }}. {{ disk.name }} ({{ getDeviceType(disk) }})
                </li>
              </ul>
            </div>
          </template>
        </LabelValue>
      </div>
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.CDROMs')">
          <template #value>
            <div>
              <ul v-if="cdroms.length > 0">
                <li v-for="(rom) in cdroms" :key="rom.name">
                  {{ rom.name }}
                </li>
              </ul>
              <span v-else>
                {{ t("harvester.virtualMachine.detail.notAvailable") }}
              </span>
            </div>
          </template>
        </LabelValue>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .row {
    margin-bottom: 20px;
  }

  .cpuMemory {
    margin-bottom: 0px;
  }
</style>
