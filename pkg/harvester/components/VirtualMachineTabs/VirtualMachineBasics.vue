<script>
import HarvesterIpAddress from '@shell/components/formatter/HarvesterIpAddress';
import VMConsoleBar from '../VMConsoleBar';
import LabelValue from '@shell/components/LabelValue';
import InputOrDisplay from '@shell/components/InputOrDisplay';
import { HCI } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';

const UNDEFINED = 'n/a';

export default {
  name: 'Details',

  components: {
    VMConsoleBar,
    HarvesterIpAddress,
    LabelValue,
    InputOrDisplay
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    },
    resource: {
      type:     Object,
      required: true,
      default:  () => {
        return {};
      }
    },
    mode: {
      type:     String,
      required: true,
    },
  },

  computed: {
    creationTimestamp() {
      const date = new Date(this.value?.metadata?.creationTimestamp);

      if (!date.getMonth) {
        return UNDEFINED;
      }

      return `${ date.getMonth() + 1 }/${ date.getDate() }/${ date.getUTCFullYear() }`;
    },

    node() {
      return this.resource?.status?.nodeName || UNDEFINED;
    },

    hostname() {
      return this.resource?.spec?.hostname || this.resource?.status?.guestOSInfo?.hostname;
    },

    imageName() {
      const imageList = this.$store.getters['harvester/all'](HCI.IMAGE) || [];

      const image = imageList.find( (I) => {
        return this.value.rootImageId === I.id;
      });

      return image?.spec?.displayName || 'N/A';
    },

    disks() {
      const disks = this.value?.spec?.template?.spec?.domain?.devices?.disks || [];

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
      const disks = this.value?.spec?.template?.spec?.domain?.devices?.disks || [];

      return disks.filter((disk) => {
        return !!disk.cdrom;
      });
    },

    flavor() {
      const domain = this.value?.spec?.template?.spec?.domain;

      return `${ domain.cpu?.cores } vCPU , ${ domain.resources?.limits?.memory } ${ this.t('harvester.virtualMachine.input.memory') }`;
    },

    kernelRelease() {
      return this.resource?.status?.guestOSInfo?.kernelRelease;
    },

    operatingSystem() {
      return this.resource?.status?.guestOSInfo?.prettyName;
    },

    isDown() {
      return this.isEmpty(this.resource);
    },

    machineType() {
      return this.value?.spec?.template?.spec?.domain?.machine?.type || undefined;
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
        <LabelValue :name="t('harvester.virtualMachine.detail.details.name')" :value="value.nameDisplay">
          <template #value>
            <div class="smart-row">
              <div class="console">
                {{ value.nameDisplay }} <VMConsoleBar :resource="value" class="consoleBut" />
              </div>
            </div>
          </template>
        </LabelValue>
      </div>

      <div class="col span-6">
        <LabelValue :name="t('harvester.fields.image')" :value="imageName" />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.hostname')" :value="hostname">
          <template #value>
            <div v-if="!isDown">
              {{ hostname || t("harvester.virtualMachine.detail.GuestAgentNotInstalled") }}
            </div>
            <div v-else>
              {{ t("harvester.virtualMachine.detail.details.down") }}
            </div>
          </template>
        </LabelValue>
      </div>

      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.node')" :value="node">
          <template #value>
            <div v-if="!isDown">
              {{ node }}
            </div>
            <div v-else>
              {{ t("harvester.virtualMachine.detail.details.down") }}
            </div>
          </template>
        </LabelValue>
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.ipAddress')">
          <template #value>
            <HarvesterIpAddress v-model="value.id" :row="value" />
          </template>
        </LabelValue>
      </div>

      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.created')" :value="creationTimestamp" />
      </div>
    </div>

    <hr class="section-divider" />

    <h2>{{ t('harvester.virtualMachine.detail.tabs.configurations') }}</h2>

    <div class="row">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.virtualMachine.detail.details.bootOrder')" :value="disks" :mode="mode">
          <template #value>
            <ul>
              <li v-for="(disk) in disks" :key="disk.bootOrder">
                {{ disk.bootOrder }}. {{ disk.name }} ({{ getDeviceType(disk) }})
              </li>
            </ul>
          </template>
        </InputOrDisplay>
      </div>
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.virtualMachine.detail.details.CDROMs')" :value="cdroms" :mode="mode">
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
        </InputOrDisplay>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.operatingSystem')" :value="operatingSystem || t('harvester.virtualMachine.detail.GuestAgentNotInstalled')" />
      </div>
      <LabelValue :name="t('harvester.virtualMachine.detail.details.flavor')" :value="flavor" />
    </div>
    <div class="row">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.kernelRelease')" :value="kernelRelease || t('harvester.virtualMachine.detail.GuestAgentNotInstalled')" />
      </div>

      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.input.MachineType')" :value="machineType" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .consoleBut {
    position: relative;
    top: -20px;
    left: 38px;
  }

  .overview-basics {
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: auto;
    grid-row-gap: 15px;

    .badge-state {
      padding: 2px 5px;
      font-size: 12px;
      margin-right: 3px;
    }

    .smart-row {
      display: flex;
      flex-direction: row;

      .console {
        display: flex;
      }
    }

    &__name {
      flex: 1;
    }

    &__ssh-key {
      min-width: 150px;
    }
  }
</style>
