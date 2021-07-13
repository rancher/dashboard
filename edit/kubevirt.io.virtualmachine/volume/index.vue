<script>
import _ from 'lodash';
import randomstring from 'randomstring';
import { PVC, STORAGE_CLASS } from '@/config/types';
import { removeObject } from '@/utils/array.js';
import { clone } from '@/utils/object';
import { sortBy } from '@/utils/sort';
import { SOURCE_TYPE, InterfaceOption } from '@/config/map';
import ModalWithCard from '@/components/ModalWithCard';
import { _VIEW, _EDIT } from '@/config/query-params';
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
      default: 'ReadWriteOnce'
    },

    // namespaced configmaps and secrets
    configMaps: {
      type:    Array,
      default: () => []
    },

    secrets: {
      type:    Array,
      default: () => []
    }
  },

  async fetch() {
    const pvcs = await this.$store.dispatch('cluster/findAll', { type: PVC });
    const namespace = this.namespace || this.$store.getters['defaultNamespace'];

    this.pvcs = pvcs.filter(pvc => pvc.metadata.namespace === namespace);
  },

  data() {
    return {
      SOURCE_TYPE,
      rows:    clone(this.value),
      pvcs:    [],
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

      _.remove(baseOrder, (n) => {
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
      const choices = this.$store.getters['cluster/all'](STORAGE_CLASS);

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
    }
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
        pvcNS:            'default',
        size:             '10Gi',
        type:             'disk',
        accessMode:       this.customAccessMode,
        volumeMode:       this.customVolumeMode,
        volumeName:        '',
        bus:              'virtio',
        newCreateId:      randomstring.generate(10), // judge whether it is a disk that has been created
      };

      this.rows.push(neu);
      this.$emit('input', this.rows);
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
        'New':               this.$store.getters['i18n/t']('harvester.vmPage.volume.title.volume'), // eslint-disable-line
        'VM Image':          this.$store.getters['i18n/t']('harvester.vmPage.volume.title.vmImage'),
        'Existing Volume':   this.$store.getters['i18n/t']('harvester.vmPage.volume.title.existingVolume'),
        'Container':         this.$store.getters['i18n/t']('harvester.vmPage.volume.title.container'), // eslint-disable-line
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
    }
  }
};
</script>

<template>
  <div>
    <div v-for="(volume, i) in rows" :key="i">
      <InfoBox class="volume-source">
        <button v-if="i !== 0 && isDisableClose" type="button" class="role-link btn btn-lg remove-vol" @click="removeVolume(volume)">
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
            :access-mode-option="accessModeOption"
            :volume-mode-option="volumeModeOption"
            :mode="mode"
            :idx="i"
            @update="update"
          />
        </div>
      </InfoBox>
      <Banner v-if="showVolumeTip" color="warning" :label="t('harvester.vmPage.volume.volumeTip')" />
    </div>
    <div v-if="!isView">
      <button type="button" class="btn btn-sm bg-primary mr-15 mb-10" @click="addVolume(SOURCE_TYPE.NEW)">
        {{ t('harvester.vmPage.buttons.addVolume') }}
      </button>

      <button type="button" class="btn btn-sm bg-primary mr-15 mb-10" @click="addVolume(SOURCE_TYPE.ATTACH_VOLUME)">
        {{ t('harvester.vmPage.buttons.addExistingVolume') }}
      </button>

      <button type="button" class="btn btn-sm bg-primary mr-15 mb-10" @click="addVolume(SOURCE_TYPE.IMAGE)">
        {{ t('harvester.vmPage.buttons.addVmImage') }}
      </button>

      <button type="button" class="btn btn-sm bg-primary mb-10" @click="addVolume(SOURCE_TYPE.CONTAINER)">
        {{ t('harvester.vmPage.buttons.addContainer') }}
      </button>
    </div>

    <ModalWithCard ref="deleteTip" name="deleteTip" :width="400">
      <template #title>
        Are you sure?
      </template>

      <template #content>
        <div>
          <span>Are you sure you want to unmount this volume?</span>
        </div>
      </template>

      <template #footer>
        <button class="btn role-secondary btn-sm mr-20" @click.prevent="cancel">
          No
        </button>
        <button class="btn role-tertiary bg-primary btn-sm mr-20" @click.prevent="save">
          Yes
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

.add-vol:focus{
  outline: none;
  box-shadow: none;
}

</style>
