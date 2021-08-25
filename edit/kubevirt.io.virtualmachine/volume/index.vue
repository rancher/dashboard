<script>
import remove from 'lodash/remove';
import randomstring from 'randomstring';
import { STORAGE_CLASS, PVC } from '@/config/types';
import { removeObject } from '@/utils/array';
import { clone } from '@/utils/object';
import { sortBy } from '@/utils/sort';
import { SOURCE_TYPE, InterfaceOption } from '@/config/map';
import ModalWithCard from '@/components/ModalWithCard';
import { _VIEW, _EDIT, _CREATE } from '@/config/query-params';
import InfoBox from '@/components/InfoBox';
import Banner from '@/components/Banner';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: {
    InfoBox, LabeledInput, UnitInput, LabeledSelect, ModalWithCard, Banner
  },

  props:      {
    vm: {
      type:       Object,
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
    await this.$store.dispatch('virtual/findAll', { type: PVC });
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
    isCreate() {
      return this.mode === _CREATE;
    },
    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isDisableClose() {
      return !this.isView;
    },

    accessModeOption() {
      return [{
        label: 'Single User(RWO)',
        value: 'ReadWriteOnce'
      }, {
        label: 'Shared Access(RWX)',
        value: 'ReadWriteMany'
      }, {
        label: 'Read Only(ROX)',
        value: 'ReadOnlyMany'
      }];
    },

    volumeModeOption() {
      return [{
        label: 'FileSystem',
        value: 'Filesystem'
      }, {
        label: 'Block',
        value: 'Block'
      }];
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

    bootOrderOption() {
      const baseOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      remove(baseOrder, (n) => {
        return this.choosedOrder.includes(n);
      });
      baseOrder.unshift('-');

      return baseOrder;
    },

    choosedOrder() {
      return this.rows.map( R => R.bootOrder );
    },

    InterfaceOption() {
      return InterfaceOption;
    },

    storageOption() {
      const choices = this.$store.getters['virtual/all'](STORAGE_CLASS);

      return sortBy(
        choices
          .map((obj) => {
            return {
              label: obj.metadata.name,
              value: obj.metadata.name
            };
          }),
        'label'
      );
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
    value(neu) {
      this.rows = neu;
    },
  },

  methods: {
    addVolume(type) {
      const name = this.getName();
      const neu = {
        name,
        source:           type,
        size:             '10Gi',
        type:             'disk',
        accessMode:       this.customAccessMode,
        volumeMode:       this.customVolumeMode,
        volumeName:        '',
        bus:              'virtio',
        newCreateId:      randomstring.generate(10), // judge whether it is a disk that has been created
      };

      this.rows.push(neu);
      this.update();
    },

    getName() {
      let name = '';
      let hasName = true;

      while (hasName) {
        name = `disk-${ this.nameIdx }`;
        hasName = this.rows.find( O => O.name === name);
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

    setRootDisk(idx) {
      this.rows = [...this.rows.splice(idx, 1), ...this.rows];
      this.update();
    },

    componentFor(type) {
      switch (type) {
      case SOURCE_TYPE.NEW:
        return require(`@/edit/kubevirt.io.virtualmachine/volume/type/volume.vue`).default;
      case SOURCE_TYPE.IMAGE:
        return require(`@/edit/kubevirt.io.virtualmachine/volume/type/vmImage.vue`).default;
      case SOURCE_TYPE.ATTACH_VOLUME:
        return require(`@/edit/kubevirt.io.virtualmachine/volume/type/existing.vue`).default;
      case SOURCE_TYPE.CONTAINER:
        return require(`@/edit/kubevirt.io.virtualmachine/volume/type/container.vue`).default;
      }
    },

    headerFor(type) {
      return {
        'New':               this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.volume'), // eslint-disable-line
        'VM Image':          this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.vmImage'),
        'Existing Volume':   this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.existingVolume'),
        'Container':         this.$store.getters['i18n/t']('harvester.virtualMachine.volume.title.container'), // eslint-disable-line
      }[type];
    },

    update() {
      this.$emit('input', this.rows);
    },

    save() {
      removeObject(this.rows, this.vol);
      this.update();
      this.cancel();
    },

    cancel() {
      this.$refs.deleteTip.hide();
    },
  }
};
</script>

<template>
  <div>
    <div v-for="(volume, i) in rows" :key="i">
      <InfoBox class="volume-source">
        <button v-if="isDisableClose" type="button" class="role-link btn btn-sm remove-vol" @click="removeVolume(volume)">
          <i class="icon icon-2x icon-x" />
        </button>
        <h3>{{ headerFor(volume.source) }}</h3>
        <div>
          <component
            :is="componentFor(volume.source)"
            v-model="rows[i]"
            :rows="rows"
            :type-option="typeOption"
            :storage-option="storageOption"
            :interface-option="InterfaceOption"
            :boot-order-option="bootOrderOption"
            :namespace="namespace"
            :is-create="isCreate"
            :is-edit="isEdit"
            :is-view="isView"
            :vm="vm"
            :access-mode-option="accessModeOption"
            :volume-mode-option="volumeModeOption"
            :mode="mode"
            :idx="i"
            :need-root-disk="needRootDisk"
            @update="update"
            @setRootDisk="setRootDisk"
          />
        </div>
      </InfoBox>
      <Banner v-if="showVolumeTip" color="warning" :label="t('harvester.virtualMachine.volume.volumeTip')" />
    </div>

    <div v-if="!isView">
      <button type="button" class="btn btn-sm bg-primary mr-15 mb-10" :disabled="rows.length === 0" @click="addVolume(SOURCE_TYPE.NEW)">
        {{ t('harvester.virtualMachine.volume.addVolume') }}
      </button>

      <button type="button" class="btn btn-sm bg-primary mr-15 mb-10" @click="addVolume(SOURCE_TYPE.ATTACH_VOLUME)">
        {{ t('harvester.virtualMachine.volume.addExistingVolume') }}
      </button>

      <button type="button" class="btn btn-sm bg-primary mr-15 mb-10" @click="addVolume(SOURCE_TYPE.IMAGE)">
        {{ t('harvester.virtualMachine.volume.addVmImage') }}
      </button>

      <button type="button" class="btn btn-sm bg-primary mb-10" :disabled="rows.length === 0" @click="addVolume(SOURCE_TYPE.CONTAINER)">
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
        <button class="btn role-tertiary bg-primary btn-sm mr-20" @click.prevent="save">
          {{ t('generic.yes') }}
        </button>
      </template>
    </ModalWithCard>
  </div>
</template>

<style lang='scss' scoped>
.volume-source{
  position: relative;
}

.remove-vol {
  position: absolute;
  top: 10px;
  right: 10px;
  padding:0px;
}
</style>
