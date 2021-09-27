<script>
import pickBy from 'lodash/pickBy';
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
import { matchesSomeRegex } from '@/utils/string';
import { clone } from '@/utils/object';
import { exceptionToErrorsArray } from '@/utils/error';
import KeyValue from '@/components/form/KeyValue';
import { sortBy } from '@/utils/sort';
import Banner from '@/components/Banner';
import HarvesterDisk from './HarvesterDisk';

const LONGHORN_SYSTEM = 'longhorn-system';

export default {
  name:       'HarvesterEditNode',
  components: {
    Footer,
    Tabbed,
    InfoBox,
    Tab,
    LabeledInput,
    LabeledSelect,
    NameNsDescription,
    ArrayListGrouped,
    HarvesterDisk,
    ButtonDropdown,
    KeyValue,
    Banner,
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
    const hostNetworkResource = hostNetworks.find( O => this.value.id === O.attachNodeName);

    if (hostNetworkResource) {
      this.hostNetworkResource = hostNetworkResource;
      this.nic = hostNetworkResource.spec?.nic;
      this.type = hostNetworkResource.spec?.type;
      this.nics = hostNetworkResource.nics;
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
          isNew:          true,
          name:           d?.metadata?.name,
          originPath:     d?.spec?.fileSystem?.mountPoint,
          path:           d?.spec?.fileSystem?.mountPoint,
          blockDevice:    d,
          displayName:    d?.spec?.devPath,
          forceFormatted: d?.spec?.fileSystem?.forceFormatted || false,
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
      hostNetworkResource:  null,
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
        const isRecommended = N.usedByManagementNetwork ? `(${ this.$store.getters['i18n/t']('harvester.host.detail.notRecommended') })` : '';

        const label = `${ N.name }(${ N.state })   ${ isRecommended }`;

        return {
          value:                   N.name,
          label,
          state:                   N.state,
          usedByManagementNetwork: N.usedByManagementNetwork,
        };
      });
    },
    blockDeviceOpts() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const blockDevices = this.$store.getters[`${ inStore }/all`](HCI.BLOCK_DEVICE);

      const out = blockDevices
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
          const devPath = d.spec?.devPath;
          const deviceType = d.status?.deviceStatus?.details?.deviceType;
          const sizeBytes = d.status?.deviceStatus?.capacity?.sizeBytes;
          const size = formatSi(sizeBytes, { increment: 1024 });

          return {
            label:  `${ devPath } (Type: ${ deviceType }, Size: ${ size })`,
            value:  d.id,
            action: this.addDisk,
          };
        });

      return sortBy(out, 'label');
    },
    removedDisks() {
      const out = this.disks.filter((d) => {
        return !findBy(this.newDisks, 'name', d.name);
      }) || [];

      return out;
    },
    longhornDisks() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `${ LONGHORN_SYSTEM }/${ this.value.id }`);
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
        const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `${ LONGHORN_SYSTEM }/${ key }`);

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
          forceFormatted:   blockDevice?.spec?.fileSystem?.forceFormatted || false,
        };
      });

      return longhornDisks;
    },

    showFormattedWarning() {
      const out = this.newDisks.filter(d => d.forceFormatted && d.isNew) || [];

      return out.length > 0;
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
      if (this.hostNetworkResource) {
        this.hostNetworkResource.save();
      }
    },
    update() {
      this.$set(this.hostNetworkResource.spec, 'nic', this.nic);
    },
    addDisk(id) {
      const removedDisk = findBy(this.removedDisks, 'blockDevice.id', id);

      if (removedDisk) {
        return this.newDisks.push(removedDisk);
      }

      const inStore = this.$store.getters['currentProduct'].inStore;
      const disk = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, id);
      const mountPoint = disk?.spec?.fileSystem?.mountPoint;

      let forceFormatted;
      const deviceType = disk?.status?.deviceStatus?.details?.deviceType;

      if (disk?.status?.deviceStatus?.fileSystem?.type) {
        forceFormatted = false;
      } else if (deviceType === 'part') {
        forceFormatted = false;
      } else if (deviceType === 'disk') {
        forceFormatted = !disk?.status?.deviceStatus?.partitioned;
      }

      const name = disk?.metadata?.name;

      this.newDisks.push({
        name,
        path:              mountPoint || `/var/lib/harvester/extra-disks/${ name }`,
        allowScheduling:   false,
        evictionRequested: false,
        storageReserved:   0,
        isNew:             true,
        originPath:        disk?.spec?.fileSystem?.mountPoint,
        blockDevice:       disk,
        displayName:       disk?.spec?.devPath,
        forceFormatted,
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
          const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `${ LONGHORN_SYSTEM }/${ d.name }`);

          blockDevice.spec.fileSystem.provisioned = true;
          blockDevice.spec.fileSystem.mountPoint = d.path;
          blockDevice.spec.fileSystem.forceFormatted = d.forceFormatted;

          return blockDevice.save();
        }));

        await Promise.all(removeDisks.map((d) => {
          const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `${ LONGHORN_SYSTEM }/${ d.name }`);

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
    },

    updateHostLabels(val) {
      const reg = /(k3s|kubernetes|kubevirt|harvesterhci|k3os)+\.io/;
      const all = this.value.metadata.labels || {};
      const wasFiltered = pickBy(all, (value, key) => {
        return reg.test(key);
      });
      const wasIgnored = pickBy(all, (value, key) => {
        return matchesSomeRegex(key, this.value.labelsToIgnoreRegexes);
      });

      this.$set(this.value.metadata, 'labels', {
        ...wasIgnored, ...wasFiltered, ...val
      });
    },
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
                :disabled="!hostNetworkResource"
                @input="update"
              >
                <template v-slot:option="option">
                  <template>
                    <div class="nicOption">
                      <span>{{ option.value }}({{ option.state }}) </span> <span class="pull-right">{{ option.usedByManagementNetwork ? t('harvester.host.detail.notRecommended') : '' }}</span>
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
            <HarvesterDisk
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
      <Tab name="labels" label-key="harvester.host.tabs.labels">
        <KeyValue
          key="labels"
          :value="value.filteredSystemLabels"
          :add-label="t('labels.addLabel')"
          :mode="mode"
          :title="t('labels.labels.title')"
          :read-allowed="false"
          :value-can-be-empty="true"
          @input="updateHostLabels"
        />
      </Tab>
    </Tabbed>
    <Banner
      v-if="showFormattedWarning"
      color="warning"
      :label="t('harvester.host.disk.forceFormatted.toolTip')"
    />
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
