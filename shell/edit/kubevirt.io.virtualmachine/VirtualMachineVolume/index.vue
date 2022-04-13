<script>
import draggable from 'vuedraggable';
import InfoBox from '@shell/components/InfoBox';
import Banner from '@shell/components/Banner';
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter';
import UnitInput from '@shell/components/form/UnitInput';
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ModalWithCard from '@shell/components/ModalWithCard';

import { PVC, HCI } from '@shell/config/types';
import { clone } from '@shell/utils/object';
import { removeObject } from '@shell/utils/array';
import { randomStr } from '@shell/utils/string';
import { SOURCE_TYPE } from '@shell/config/harvester-map';
import { _VIEW, _EDIT, _CREATE } from '@shell/config/query-params';

export default {
  components: {
    Banner, BadgeStateFormatter, draggable, InfoBox, LabeledInput, UnitInput, LabeledSelect, ModalWithCard
  },

  props: {
    vm: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    namespace: {
      type:    String,
      default: null
    },

    existingVolumeDisabled: {
      type:    Boolean,
      default: false
    },

    validateRequired: {
      type:    Boolean,
      default: false
    },

    customVolumeMode: {
      type:    String,
      default: 'Block'
    },

    customAccessMode: {
      type:    String,
      default: 'ReadWriteMany'
    },

    resourceType: {
      type:    String,
      default: ''
    }
  },

  async fetch() {
    await this.$store.dispatch('harvester/findAll', { type: PVC });
  },

  data() {
    return {
      SOURCE_TYPE,
      rows:    clone(this.value),
      nameIdx: 1,
      vol:     null
    };
  },

  computed: {
    isVirtualType() {
      return this.resourceType === HCI.VM;
    },

    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    showVolumeTip() {
      const imageName = this.getImageDisplayName(this.rows[0]?.image);

      if (this.rows.length === 1 && this.rows[0].type === 'cd-rom' && /.iso$/i.test(imageName)) {
        return true;
      }

      return false;
    },

    pvcs() {
      return this.$store.getters['harvester/all'](PVC) || [];
    },
  },

  watch: {
    value: {
      handler(neu) {
        const rows = neu.map((V) => {
          if (!this.isCreate && V.source !== SOURCE_TYPE.CONTAINER && !V.newCreateId) {
            V.to = {
              name:   'c-cluster-product-resource-namespace-id',
              params: {
                product:   'harvester',
                resource:  HCI.VOLUME,
                namespace: this.namespace,
                id:        V.realName
              },
              query: { mode: _EDIT }
            };

            V.pvc = this.pvcs.find(pvc => pvc.metadata.name === V.realName);
          }

          return V;
        });

        this.$set(this, 'rows', rows);
      },
      deep:      true,
      immediate: true,
    },
  },

  methods: {
    addVolume(type) {
      const name = this.generateName();
      const neu = {
        id:          randomStr(5),
        name,
        source:      type,
        size:        '10Gi',
        type:        'disk',
        accessMode:  this.customAccessMode,
        volumeMode:  this.customVolumeMode,
        volumeName:  '',
        bus:         'virtio',
        newCreateId: randomStr(10), // judge whether it is a disk that has been created
      };

      this.rows.push(neu);
      this.update();
    },

    generateName() {
      let name = '';
      let hasName = true;

      while (hasName) {
        name = `disk-${ this.nameIdx }`;
        hasName = this.rows.find(O => O.name === name);
        this.nameIdx++;
      }

      return name;
    },

    removeVolume(vol) {
      this.vol = vol;
      if (!vol.newCreateId && this.isEdit && this.isVirtualType) {
        this.$refs.deleteTip.open();
      } else {
        removeObject(this.rows, vol);
        this.update();
      }
    },

    unplugVolume(volume) {
      this.vm.unplugVolume(volume.name);
    },

    componentFor(type) {
      switch (type) {
      case SOURCE_TYPE.NEW:
        return require(`@shell/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/volume.vue`).default;
      case SOURCE_TYPE.IMAGE:
        return require(`@shell/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/vmImage.vue`).default;
      case SOURCE_TYPE.ATTACH_VOLUME:
        return require(`@shell/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/existing.vue`).default;
      case SOURCE_TYPE.CONTAINER:
        return require(`@shell/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/container.vue`).default;
      }
    },

    headerFor(type) {
      return {
        [SOURCE_TYPE.NEW]:           this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.volume'),
        [SOURCE_TYPE.IMAGE]:         this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.vmImage'),
        [SOURCE_TYPE.ATTACH_VOLUME]: this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.existingVolume'),
        [SOURCE_TYPE.CONTAINER]:     this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.container'),
      }[type];
    },

    update() {
      this.$emit('input', this.rows);
    },

    deleteVolume() {
      removeObject(this.rows, this.vol);
      this.update();
      this.cancel();
    },

    cancel() {
      this.$refs.deleteTip.hide();
    },

    changeSort(idx, type) {
      // true: down, false: up
      this.rows.splice(type ? idx : idx - 1, 1, ...this.rows.splice(type ? idx + 1 : idx, 1, this.rows[type ? idx : idx - 1]));
      this.update();
    },

    getImageDisplayName(id) {
      return this.$store.getters['harvester/all'](HCI.IMAGE).find(image => image.id === id)?.spec?.displayName;
    }
  },
};
</script>

<template>
  <div>
    <Banner v-if="!isView" color="info" label-key="harvester.virtualMachine.volume.dragTip" />
    <draggable v-model="rows" :disabled="isView" @end="update">
      <transition-group>
        <div v-for="(volume, i) in rows" :key="volume.id">
          <InfoBox class="box">
            <button v-if="!isView" type="button" class="role-link btn btn-sm remove" @click="removeVolume(volume)">
              <i class="icon icon-2x icon-x" />
            </button>
            <button v-if="volume.hotpluggable && isView" type="button" class="role-link btn remove" @click="unplugVolume(volume)">
              {{ t('harvester.virtualMachine.unplug.detachVolume') }}
            </button>
            <h3>
              <span v-if="volume.to && isVirtualType" class="title">
                <n-link :to="volume.to">
                  {{ t('harvester.virtualMachine.volume.edit') }} {{ headerFor(volume.source) }}
                </n-link>

                <BadgeStateFormatter v-if="volume.pvc" class="ml-10 state" :arbitrary="true" :row="volume.pvc" :value="volume.pvc.state" />
              </span>

              <span v-else>
                {{ headerFor(volume.source) }}
              </span>
            </h3>
            <div>
              <component
                :is="componentFor(volume.source)"
                v-model="rows[i]"
                :rows="rows"
                :namespace="namespace"
                :is-create="isCreate"
                :is-edit="isEdit"
                :is-view="isView"
                :is-virtual-type="isVirtualType"
                :mode="mode"
                :idx="i"
                :validate-required="validateRequired"
                @update="update"
              />
            </div>

            <div class="bootOrder">
              <div v-if="!isView" class="mr-15">
                <button :disabled="i === 0" class="btn btn-sm role-primary" @click.prevent="changeSort(i, false)">
                  <i class="icon icon-lg icon-chevron-up"></i>
                </button>

                <button :disabled="i === rows.length -1" class="btn btn-sm role-primary" @click.prevent="changeSort(i, true)">
                  <i class="icon icon-lg icon-chevron-down"></i>
                </button>
              </div>

              <div class="text-muted">
                bootOrder: {{ i + 1 }}
              </div>
            </div>

            <Banner v-if="volume.volumeStatus" class="mt-15" color="warning" :label="volume.volumeStatus.status" />
          </InfoBox>
        </div>
      </transition-group>
    </draggable>
    <Banner v-if="showVolumeTip" color="warning" :label="t('harvester.virtualMachine.volume.volumeTip')" />

    <div v-if="!isView">
      <button
        type="button"
        class="btn btn-sm bg-primary mr-15 mb-10"
        :disabled="rows.length === 0"
        @click="addVolume(SOURCE_TYPE.NEW)"
      >
        {{ t('harvester.virtualMachine.volume.addVolume') }}
      </button>

      <button v-if="!existingVolumeDisabled" type="button" class="btn btn-sm bg-primary mr-15 mb-10" @click="addVolume(SOURCE_TYPE.ATTACH_VOLUME)">
        {{ t('harvester.virtualMachine.volume.addExistingVolume') }}
      </button>

      <button type="button" class="btn btn-sm bg-primary mr-15 mb-10" @click="addVolume(SOURCE_TYPE.IMAGE)">
        {{ t('harvester.virtualMachine.volume.addVmImage') }}
      </button>

      <button
        type="button"
        class="btn btn-sm bg-primary mb-10"
        :disabled="rows.length === 0"
        @click="addVolume(SOURCE_TYPE.CONTAINER)"
      >
        {{ t('harvester.virtualMachine.volume.addContainer') }}
      </button>
    </div>

    <ModalWithCard ref="deleteTip" name="deleteTip" :width="400">
      <template #title>
        {{ t('harvester.virtualMachine.volume.unmount.title') }}
      </template>

      <template #content>
        <span>{{ t('harvester.virtualMachine.volume.unmount.message') }}</span>
      </template>

      <template #footer>
        <div class="buttons">
          <button class="btn role-secondary mr-20" @click.prevent="cancel">
            {{ t('generic.no') }}
          </button>

          <button class="btn bg-primary mr-20" @click.prevent="deleteVolume">
            {{ t('generic.yes') }}
          </button>
        </div>
      </template>
    </ModalWithCard>
  </div>
</template>

<style lang='scss' scoped>
  .box {
    position: relative;
  }

  .title {
    display: flex;

    .state {
      font-size: 16px;
    }
  }

  .remove {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 0px;
  }

  .bootOrder {
    display: flex;
    align-items: center;
  }

  .buttons {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
</style>
