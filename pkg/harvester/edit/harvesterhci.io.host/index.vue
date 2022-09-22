<script>
import { mapGetters } from 'vuex';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import Footer from '@shell/components/form/Footer';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import ButtonDropdown from '@shell/components/ButtonDropdown';
import CreateEditView from '@shell/mixins/create-edit-view';
import { HCI as HCI_LABELS_ANNOTATIONS } from '@shell/config/labels-annotations';
import { LONGHORN } from '@shell/config/types';
import { HCI } from '../../types';
import { allHash } from '@shell/utils/promise';
import { formatSi } from '@shell/utils/units';
import { findBy } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { exceptionToErrorsArray } from '@shell/utils/error';
import KeyValue from '@shell/components/form/KeyValue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { sortBy } from '@shell/utils/sort';
import { Banner } from '@components/Banner';
import HarvesterDisk from './HarvesterDisk';
import HarvesterKsmtuned from './HarvesterKsmtuned';

const LONGHORN_SYSTEM = 'longhorn-system';

export default {
  name:       'HarvesterEditNode',
  components: {
    Footer,
    Tabbed,
    Tab,
    LabeledInput,
    NameNsDescription,
    ArrayListGrouped,
    HarvesterDisk,
    HarvesterKsmtuned,
    ButtonDropdown,
    KeyValue,
    Banner,
    LabeledSelect,
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

    await allHash({
      longhornNodes: this.$store.dispatch(`${ inStore }/findAll`, { type: LONGHORN.NODES }),
      blockDevices:  this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.BLOCK_DEVICE }),
    });

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
          displayName:    d?.displayName,
          forceFormatted: d?.spec?.fileSystem?.forceFormatted || false,
        };
      });

    const disks = [...this.longhornDisks, ...provisionedBlockDevices];

    this.disks = disks;
    this.newDisks = clone(disks);
    this.blockDeviceOpts = this.getBlockDeviceOpts();
  },
  data() {
    const customName = this.value.metadata?.annotations?.[HCI_LABELS_ANNOTATIONS.HOST_CUSTOM_NAME] || '';
    const consoleUrl = this.value.metadata?.annotations?.[HCI_LABELS_ANNOTATIONS.HOST_CONSOLE_URL] || '';

    return {
      customName,
      consoleUrl,
      disks:                [],
      newDisks:             [],
      blockDevice:          [],
      blockDeviceOpts:      [],
      filteredLabels:       clone(this.value.filteredSystemLabels),
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

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
      const diskSpec = longhornNode?.spec?.disks || {};

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
          displayName:      blockDevice?.displayName || key,
          forceFormatted:   blockDevice?.spec?.fileSystem?.forceFormatted || false,
          tags:             diskSpec?.[key]?.tags || [],
        };
      });

      return longhornDisks;
    },

    showFormattedWarning() {
      const out = this.newDisks.filter(d => d.forceFormatted && d.isNew) || [];

      return out.length > 0;
    },

    hasBlockDevicesSchema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return !!this.$store.getters[`${ inStore }/schemaFor`](HCI.BLOCK_DEVICE);
    },

    longhornNode() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNodes = this.$store.getters[`${ inStore }/all`](LONGHORN.NODES);

      return longhornNodes.find(node => node.id === `${ LONGHORN_SYSTEM }/${ this.value.id }`);
    },
  },
  watch: {
    customName(neu) {
      this.value.setAnnotation(HCI_LABELS_ANNOTATIONS.HOST_CUSTOM_NAME, neu);
    },

    consoleUrl(neu) {
      this.value.setAnnotation(HCI_LABELS_ANNOTATIONS.HOST_CONSOLE_URL, neu);
    },

    newDisks() {
      this.blockDeviceOpts = this.getBlockDeviceOpts();
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }

    if (this.registerAfterHook) {
      this.registerAfterHook(this.saveDisk);
      this.registerAfterHook(this.saveLonghornNode);
    }
  },

  methods: {
    addDisk(id) {
      const removedDisk = findBy(this.removedDisks, 'blockDevice.id', id);

      if (removedDisk) {
        return this.newDisks.push(removedDisk);
      }

      const inStore = this.$store.getters['currentProduct'].inStore;
      const disk = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, id);
      const mountPoint = disk?.spec?.fileSystem?.mountPoint;
      const lastFormattedAt = disk?.status?.deviceStatus?.fileSystem?.LastFormattedAt;

      let forceFormatted = true;
      const systems = ['ext4', 'XFS'];

      if (disk.childParts?.length > 0) {
        forceFormatted = true;
      } else if (lastFormattedAt) {
        forceFormatted = false;
      } else if (systems.includes(disk?.status?.deviceStatus?.fileSystem?.type)) {
        forceFormatted = false;
      }

      const name = disk?.metadata?.name;

      this.newDisks.push({
        name,
        path:              mountPoint,
        allowScheduling:   false,
        evictionRequested: false,
        storageReserved:   0,
        isNew:             true,
        originPath:        disk?.spec?.fileSystem?.mountPoint,
        blockDevice:       disk,
        displayName:       disk?.displayName,
        forceFormatted,
      });
    },

    async saveDisk() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const addDisks = this.newDisks.filter(d => d.isNew);
      const removeDisks = this.disks.filter(d => !findBy(this.newDisks, 'name', d.name) && d.blockDevice);

      try {
        await Promise.all(addDisks.map((d) => {
          const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `${ LONGHORN_SYSTEM }/${ d.name }`);

          blockDevice.spec.fileSystem.provisioned = true;
          blockDevice.spec.fileSystem.forceFormatted = d.forceFormatted;

          return blockDevice.save();
        }));

        await Promise.all(removeDisks.map((d) => {
          const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `${ LONGHORN_SYSTEM }/${ d.name }`);

          blockDevice.spec.fileSystem.provisioned = false;

          return blockDevice.save();
        }));

        this.$store.dispatch('growl/success', {
          title:   this.t('generic.notification.title.succeed'),
          message: this.t('harvester.host.disk.notification.success', { name: this.value.metadata?.name || '' }),
        }, { root: true });
      } catch (err) {
        return Promise.reject(exceptionToErrorsArray(err));
      }
    },

    canRemove(row) {
      return !!row?.value?.blockDevice;
    },

    onRemove(scope) {
      scope.remove();
    },

    updateHostLabels(labels) {
      this.filteredLabels = labels;
    },

    selectable(opt) {
      if ( opt.disabled) {
        return false;
      }

      return true;
    },

    getBlockDeviceOpts() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const blockDevices = this.$store.getters[`${ inStore }/all`](HCI.BLOCK_DEVICE);

      const out = blockDevices
        .filter((d) => {
          const addedToNodeCondition = findBy(d?.status?.conditions || [], 'type', 'AddedToNode');
          const isAdded = findBy(this.newDisks, 'name', d.metadata.name);
          const isRemoved = findBy(this.removedDisks, 'name', d.metadata.name);

          const deviceType = d.status?.deviceStatus?.details?.deviceType;

          if (deviceType !== 'disk') {
            return false;
          }

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
          const parentDevice = d.status?.deviceStatus?.parentDevice;
          const isChildAdded = this.newDisks.find(newDisk => newDisk.blockDevice?.status?.deviceStatus?.parentDevice === devPath);
          const name = d.displayName;

          let label = `${ name } (Type: ${ deviceType }, Size: ${ size })`;

          if (parentDevice) {
            label = `- ${ label }`;
          }

          return {
            label,
            value:    d.id,
            action:   this.addDisk,
            kind:     !parentDevice ? 'group' : '',
            disabled: !!isChildAdded,
            group:    parentDevice || devPath,
            isParent: !!parentDevice,
          };
        });

      return sortBy(out, ['group', 'isParent', 'label']);
    },

    ddButtonAction() {
      this.blockDeviceOpts = this.getBlockDeviceOpts();
    },

    willSave() {
      const filteredLabels = this.filteredLabels || {};

      this.value.metadata.labels = {
        ...this.value.metadata.labels,
        ...filteredLabels,
      };

      const originLabels = this.value.filteredSystemLabels;

      Object.keys(originLabels).map((key) => {
        if (!filteredLabels[key]) {
          delete this.value.metadata.labels[key];
        }
      });
    },

    async saveLonghornNode() {
      const disks = this.longhornNode?.spec?.disks || {};

      this.newDisks.map((disk) => {
        (disks[disk.name] || {}).tags = disk.tags;
      });

      try {
        await this.longhornNode.save();
      } catch (err) {
        return Promise.reject(exceptionToErrorsArray(err));
      }
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
      <Tab
        v-if="hasBlockDevicesSchema"
        name="disk"
        :weight="80"
        :label="t('harvester.host.tabs.disk')"
      >
        <div
          v-if="longhornNode"
          class="row mb-20"
        >
          <div class="col span-12">
            <LabeledSelect
              v-model="longhornNode.spec.tags"
              :mode="mode"
              :multiple="true"
              :taggable="true"
              :options="[]"
              :label="t('harvester.host.tags.label')"
              :searchable="true"
            />
          </div>
        </div>
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
              :selectable="selectable"
              @click-action="e=>addDisk(e.value)"
              @dd-button-action="ddButtonAction"
            >
              <template #option="option">
                <template v-if="option.kind === 'group'">
                  <b>
                    {{ option.label }}
                  </b>
                </template>
                <div v-else>
                  {{ option.label }}
                </div>
              </template>
            </ButtonDropdown>
          </template>
          <template #remove-button="scope">
            <button
              v-if="canRemove(scope.row, scope.i) && !isView"
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
      <Tab name="Ksmtuned" :weight="80" :label="t('harvester.host.tabs.ksmtuned')">
        <HarvesterKsmtuned :mode="mode" :node="value" :register-before-hook="registerBeforeHook" />
      </Tab>
      <Tab name="labels" label-key="harvester.host.tabs.labels">
        <KeyValue
          key="labels"
          :value="filteredLabels"
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
