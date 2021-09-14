<script>
import { mapGetters } from 'vuex';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Footer from '@/components/form/Footer';
import InfoBox from '@/components/InfoBox';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
import ButtonDropdown from '@/components/ButtonDropdown';
import CreateEditView from '@/mixins/create-edit-view';
import { HCI as HCI_LABELS_ANNOTATIONS } from '@/config/labels-annotations';
import { HCI, LONGHORN } from '@/config/types';
import { allHash } from '@/utils/promise';
import { formatSi } from '@/utils/units';
import { findBy, uniq } from '@/utils/array';
import { clone } from '@/utils/object';
import { exceptionToErrorsArray } from '@/utils/error';
import Disk from './Disk';

export default {
  name:       'EditNode',
  components: {
    Footer,
    Tabbed,
    InfoBox,
    Tab,
    LabeledInput,
    LabeledSelect,
    NameNsDescription,
    ArrayListGrouped,
    Disk,
    ButtonDropdown,
  },
  mixins: [CreateEditView],
  props:  {
    value: {
      type:     Object,
      required: true,
    }
  },
  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({
      hostNetworks:      this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.NODE_NETWORK }),
      longhornNodes: this.$store.dispatch(`${ inStore }/findAll`, { type: LONGHORN.NODES }),
      blockDevices:   this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.BLOCK_DEVICE }),
    });

    const hostNetworks = hash.hostNetworks;
    const hostNetowrkResource = hostNetworks.find( O => this.value.id === O.attachNodeName);

    if (hostNetowrkResource) {
      this.hostNetowrkResource = hostNetowrkResource;
      this.nic = hostNetowrkResource.spec?.nic;
      this.type = hostNetowrkResource.spec?.type;
      this.nics = hostNetowrkResource.nics;
    }

    const blockDevices = this.$store.getters[`${ inStore }/all`](HCI.BLOCK_DEVICE);
    const provisionedBlockDevices = blockDevices.filter((d) => {
      const provisioned = d?.spec?.fileSystem?.provisioned;
      const isCurrentNode = d?.spec?.nodeName === this.value.id;
      const isLonghornMounted = findBy(this.longhornDisks, 'name', d.metadata.name);

      return provisioned && isCurrentNode && !isLonghornMounted;
    })
      .map((d) => {
        return {
          isNew:       true,
          name:        d?.metadata?.name,
          originPath:  d?.spec?.fileSystem?.mountPoint,
          path:        d?.spec?.fileSystem?.mountPoint,
          blockDevice: d,
          displayName: d?.spec?.devPath,
        };
      });

    const disks = [...this.longhornDisks, ...provisionedBlockDevices];

    this.disks = disks;
    this.newDisks = clone(disks);
  },
  data() {
    const customName = this.value.metadata?.annotations?.[HCI_LABELS_ANNOTATIONS.HOST_CUSTOM_NAME] || '';
    const consoleUrl = this.value.metadata?.annotations?.[HCI_LABELS_ANNOTATIONS.HOST_CONSOLE_URL] || '';

    return {
      hostNetowrkResource:  null,
      customName,
      consoleUrl,
      type:                 'vlan',
      nic:                  '',
      nics:                 [],
      disks:                [],
      newDisks:             [],
      blockDevice:          [],
      dismountBlockDevices: {},
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    nicsOptions() {
      return this.nics.map( (N) => {
        const isRecommended = N.usedByManagementNetwork ? this.$store.getters['i18n/t']('harvester.host.detail.notRecommended') : '';

        return {
          value:                   N.name,
          label:                   `${ N.name }    (${ isRecommended })`,
          state:                   N.state,
          usedByManagementNetwork: N.usedByManagementNetwork,
        };
      });
    },
    blockDeviceOpts() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const blockDevices = this.$store.getters[`${ inStore }/all`](HCI.BLOCK_DEVICE);

      return blockDevices
        .filter((d) => {
          const addedToNodeCondition = findBy(d?.status?.conditions || [], 'type', 'AddedToNode');
          const isAdded = findBy(this.newDisks, 'name', d.metadata.name);
          const isRemoved = findBy(this.removedDisks, 'name', d.metadata.name);

          if ((!findBy(this.disks || [], 'name', d.metadata.name) &&
                d?.spec?.nodeName === this.value.id &&
                (!addedToNodeCondition || addedToNodeCondition?.status === 'False') &&
                !d.spec?.fileSystem?.provisioned &&
                !isAdded) ||
                isRemoved
          ) {
            return true;
          } else {
            return false;
          }
        })
        .map((d) => {
          return {
            label:  d.spec?.devPath,
            value:  d.id,
            action: this.addDisk,
          };
        });
    },
    removedDisks() {
      const out = this.disks.filter((d) => {
        return !findBy(this.newDisks, 'name', d.name);
      }) || [];

      return out;
    },
    longhornDisks() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.value.id }`);
      const diskStatus = longhornNode?.status?.diskStatus || {};
      const diskSpec = longhornNode.spec?.disks || {};

      const formatOptions = {
        increment:    1024,
        minExponent:  3,
        maxExponent:  3,
        maxPrecision: 2,
        suffix:       'iB',
      };

      const longhornDisks = Object.keys(diskStatus).map((key) => {
        const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `longhorn-system/${ key }`);

        return {
          ...diskStatus[key],
          ...diskSpec?.[key],
          name:             key,
          isNew:            false,
          storageReserved:  formatSi(diskSpec[key]?.storageReserved, formatOptions),
          storageAvailable: formatSi(diskStatus[key]?.storageAvailable, formatOptions),
          storageMaximum:   formatSi(diskStatus[key]?.storageMaximum, formatOptions),
          storageScheduled: formatSi(diskStatus[key]?.storageScheduled, formatOptions),
          blockDevice,
          displayName:      blockDevice?.spec?.devPath || key,
        };
      });

      return longhornDisks;
    },
  },
  watch: {
    customName(neu) {
      this.value.setAnnotation(HCI_LABELS_ANNOTATIONS.HOST_CUSTOM_NAME, neu);
    },

    consoleUrl(neu) {
      this.value.setAnnotation(HCI_LABELS_ANNOTATIONS.HOST_CONSOLE_URL, neu);
    },
  },

  created() {
    if (this.registerAfterHook) {
      this.registerAfterHook(this.saveHostNetwork);
      this.registerAfterHook(this.saveDisk);
    }
  },

  methods: {
    saveHostNetwork() {
      if (this.hostNetowrkResource) {
        this.hostNetowrkResource.save();
      }
    },
    update() {
      this.$set(this.hostNetowrkResource.spec, 'nic', this.nic);
    },
    addDisk(id) {
      const removedDisk = findBy(this.removedDisks, 'blockDevice.id', id);

      if (removedDisk) {
        return this.newDisks.push(removedDisk);
      }

      const inStore = this.$store.getters['currentProduct'].inStore;
      const disk = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, id);

      this.newDisks.push({
        name:              disk?.metadata?.name,
        path:              disk?.spec?.fileSystem?.mountPoint,
        allowScheduling:   false,
        evictionRequested: false,
        storageReserved:   0,
        isNew:             true,
        originPath:        disk?.spec?.fileSystem?.mountPoint,
        blockDevice:       disk,
        displayName:       disk?.spec?.devPath,
      });
    },
    async saveDisk() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const addDisks = this.newDisks.filter(d => d.isNew);
      const removeDisks = this.disks.filter(d => !findBy(this.newDisks, 'name', d.name) && d.blockDevice);

      const errors = [];

      addDisks.map((d) => {
        const path = d?.path;

        if (!path) {
          errors.push(this.t('validation.required', { key: 'Path' }));
        }

        if (!path.startsWith('/')) {
          errors.push('"Path" must start with "/"');
        }
      });

      if (errors.length > 0) {
        return Promise.reject(uniq(errors));
      }

      try {
        await Promise.all(addDisks.map((d) => {
          const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `longhorn-system/${ d.name }`);

          blockDevice.spec.fileSystem.provisioned = true;
          blockDevice.spec.fileSystem.mountPoint = d.path;

          return blockDevice.save();
        }));

        await Promise.all(removeDisks.map((d) => {
          const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `longhorn-system/${ d.name }`);

          blockDevice.spec.fileSystem.provisioned = false;
          blockDevice.spec.fileSystem.mountPoint = this.dismountBlockDevices[blockDevice.id];

          return blockDevice.save();
        }));
      } catch (err) {
        return Promise.reject(exceptionToErrorsArray(err));
      }
    },

    canRemove(row) {
      return !!row?.value?.blockDevice;
    },

    onRemove(scope) {
      const value = scope?.row?.value;

      if (value?.blockDevice?.id) {
        this.dismountBlockDevices[value.blockDevice.id] = value?.path;
      }

      scope.remove();
    }
  },
};
</script>
<template>
  <div class="node">
    <NameNsDescription
      :value="value"
      :namespaced="false"
      :mode="mode"
    />
    <Tabbed ref="tabbed" class="mt-15" :side-tabs="true">
      <Tab name="basics" :weight="100" :label="t('harvester.host.tabs.basics')">
        <LabeledInput
          v-model="customName"
          :label="t('harvester.host.detail.customName')"
          class="mb-20"
          :mode="mode"
        />

        <LabeledInput
          v-model="consoleUrl"
          :label="t('harvester.host.detail.consoleUrl')"
          class="mb-20"
          :mode="mode"
        />
      </Tab>
      <Tab name="network" :weight="90" :label="t('harvester.host.tabs.network')">
        <InfoBox class="wrapper">
          <div class="row warpper">
            <div class="col span-6">
              <LabeledInput
                v-model="type"
                label="Type"
                class="mb-20"
                :mode="mode"
                :disabled="true"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-model="nic"
                :options="nicsOptions"
                :label="t('harvester.fields.PhysicalNic')"
                class="mb-20"
                :mode="mode"
                :disabled="!hostNetowrkResource"
                @input="update"
              >
                <template v-slot:option="option">
                  <template>
                    <div class="nicOption">
                      <span>{{ option.value }} </span><span>{{ option.state }}</span> <span class="pull-right">{{ option.usedByManagementNetwork ? t('harvester.host.detail.notRecommended') : '' }}</span>
                    </div>
                  </template>
                </template>
              </LabeledSelect>
            </div>
          </div>
        </InfoBox>
      </Tab>
      <Tab
        name="disk"
        :weight="80"
        :label="t('harvester.host.tabs.disk')"
      >
        <ArrayListGrouped
          v-model="newDisks"
          :mode="mode"
        >
          <template #default="props">
            <Disk
              v-model="props.row.value"
              class="mb-20"
              :mode="mode"
              :disks="disks"
            />
          </template>
          <template #add>
            <ButtonDropdown
              v-if="!isView"
              :button-label="t('harvester.host.disk.add')"
              :dropdown-options="blockDeviceOpts"
              size="sm"
              @click-action="e=>addDisk(e.value)"
            />
          </template>
          <template #remove-button="scope">
            <button
              v-if="canRemove(scope.row, scope.i)"
              type="button"
              class="btn role-link close btn-sm"
              @click="() => onRemove(scope)"
            >
              <i class="icon icon-2x icon-x" />
            </button>
            <span v-else />
          </template>
        </ArrayListGrouped>
      </Tab>
    </Tabbed>
    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </div>
</template>
<style lang="scss" scoped>
.wrapper{
  position: relative;
}
.nicOption {
  display: flex;
  justify-content: space-between;
}
</style>
