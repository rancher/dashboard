<script>
import draggable from 'vuedraggable';
import InfoBox from '@/components/InfoBox';
import Banner from '@/components/Banner';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import ModalWithCard from '@/components/ModalWithCard';

import { PVC } from '@/config/types';
import { clone } from '@/utils/object';
import { removeObject } from '@/utils/array';
import { randomStr } from '@/utils/string';
import { SOURCE_TYPE, InterfaceOption } from '@/config/harvester-map';
import { _VIEW, _EDIT, _CREATE } from '@/config/query-params';

export default {
  components: {
    Banner, draggable, InfoBox, LabeledInput, UnitInput, LabeledSelect, ModalWithCard
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
      default: 'create'
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
    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isCreate() {
      return this.mode === _CREATE;
    },

    typeOption() {
      return [{
        label: 'disk',
        value: 'disk'
      }, {
        label: 'cd-rom',
        value: 'cd-rom'
      }];
    },

    InterfaceOption() {
      return InterfaceOption;
    },

    showVolumeTip() {
      if (this.rows.length === 1 && this.rows[0].type === 'cd-rom' && /.iso$/.test(this.rows[0].image)) {
        return true;
      }

      return false;
    },

    needRootDisk() {
      return this.rows?.[0]?.source !== SOURCE_TYPE.IMAGE && this.rows?.[0]?.source !== SOURCE_TYPE.ATTACH_VOLUME;
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
                resource:  'volume',
                namespace: this.namespace,
                id:        V.realName
              },
              query: { mode: _EDIT }
            };
          }

          return V;
        });

        this.rows = rows;
      },
      deep:      true,
      immediate: true,
    },
  },

  methods: {
    addVolume(type) {
      const name = this.getName();
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

    getName() {
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
      if (!vol.newCreateId && this.isEdit) { // if volume has been created, There is a prompt when deleting
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
        return require(`@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/volume.vue`).default;
      case SOURCE_TYPE.IMAGE:
        return require(`@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/vmImage.vue`).default;
      case SOURCE_TYPE.ATTACH_VOLUME:
        return require(`@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/existing.vue`).default;
      case SOURCE_TYPE.CONTAINER:
        return require(`@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/container.vue`).default;
      }
    },

    headerFor(type) {
      return {
        'New': this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.volume'), // eslint-disable-line
        'VM Image':        this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.vmImage'),
        'Existing Volume': this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.existingVolume'),
        'Container': this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.container'), // eslint-disable-line
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

    unplugAble(volume) {
      return volume.hotpluggable && this.isView;
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
          <InfoBox class="volume-source">
            <button v-if="!isView" type="button" class="role-link btn btn-sm remove-vol" @click="removeVolume(volume)">
              <i class="icon icon-2x icon-x" />
            </button>
            <button v-if="unplugAble(volume)" type="button" class="role-link btn btn-sm remove-vol" @click="unplugVolume(volume)">
              Detach Volume
            </button>
            <h3>
              <n-link v-if="volume.to && !isView" :to="volume.to">
                {{ t('harvester.virtualMachine.volume.edit') }} {{ headerFor(volume.source) }}
              </n-link>

              <span v-else>
                {{ headerFor(volume.source) }}
              </span>
            </h3>
            <div>
              <component
                :is="componentFor(volume.source)"
                v-model="rows[i]"
                :rows="rows"
                :type-option="typeOption"
                :interface-option="InterfaceOption"
                :namespace="namespace"
                :is-create="isCreate"
                :is-edit="isEdit"
                :is-view="isView"
                :mode="mode"
                :idx="i"
                :validate-required="validateRequired"
                :need-root-disk="needRootDisk"
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
          </InfoBox>
          <Banner v-if="showVolumeTip" color="warning" :label="t('harvester.virtualMachine.volume.volumeTip')" />
        </div>
      </transition-group>
    </draggable>

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
        <div>
          <span>{{ t('harvester.virtualMachine.volume.unmount.message') }}</span>
        </div>
      </template>

      <template #footer>
        <button class="btn role-secondary btn-sm mr-20" @click.prevent="cancel">
          {{ t('generic.no') }}
        </button>
        <button class="btn role-tertiary bg-primary btn-sm mr-20" @click.prevent="deleteVolume">
          {{ t('generic.yes') }}
        </button>
      </template>
    </ModalWithCard>
  </div>
</template>

<style lang='scss' scoped>
  .volume-source {
    position: relative;
  }

  .remove-vol {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 0px;
  }

  .bootOrder {
    display: flex;
    align-items: center;
  }
</style>
