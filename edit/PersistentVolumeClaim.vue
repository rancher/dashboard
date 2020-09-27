<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
import RadioGroup from '@/components/form/RadioGroup';
import Checkbox from '@/components/form/Checkbox';
import LabeledInput from '@/components/form/LabeledInput';
import { mapGetters } from 'vuex';
import { removeObject, addObject } from '@/utils/array';
import { STORAGE_CLASS, PV } from '@/config/types';
import { allHash } from '@/utils/promise';
export default {

  components: {
    LabeledSelect, UnitInput, RadioGroup, Checkbox, LabeledInput
  },
  props:      {
    mode: {
      type:    String,
      default: 'create'
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    registerBeforeHook: {
      type:    Function,
      default: null,
    },
  },
  async fetch() {
    const hash = await allHash({
      storageClasses:    this.$store.dispatch('cluster/findAll', { type: STORAGE_CLASS }),
      persistentVolumes: this.$store.dispatch('cluster/findAll', { type: PV }),
    });

    this.storageClasses = hash.storageClasses;
    this.persistentVolumes = hash.persistentVolumes;
  },

  data() {
    return {
      storageClasses: [], persistentVolumes: [], createPVC: true
    };
  },

  computed: {
    storageClassNames() {
      return this.storageClasses.map(sc => sc.metadata.name);
    },

    unboundPVs() {
      return this.persistentVolumes.reduce((total, each) => {
        if (each?.status?.phase !== 'bound') {
          total.push(each);
        }

        return total;
      }, []);
    },

    persistentVolumeNames() {
      return this.unboundPVs.map(pv => pv.metadata.name);
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.value.save);
    }
  },

  methods: {
    updateMode(mode, enabled) {
      if (enabled) {
        addObject(this.value.spec.accessModes, mode);
      } else {
        removeObject(this.value.spec.accessModes, mode);
      }
    },

  }

};
</script>

<template>
  <div @input="$emit('input')">
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.metadata.name" :mode="mode" :required="true" :label="t('persistentVolumeClaim.volumeName')" @input="$emit('input')" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect v-if="createPVC" v-model="value.spec.storageClassName" :mode="mode" :label="t('persistentVolumeClaim.storageClass')" :options="storageClassNames" />
        <LabeledSelect v-else v-model="value.spec.volumeName" :mode="mode" :label="t('persistentVolumeClaim.volumes')" :options="persistentVolumeNames" />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="createPVC"
          name="createPVC"
          :options="[true, false]"
          :labels="[t('persistentVolumeClaim.source.options.new'), t('persistentVolumeClaim.source.options.existing')]"
          :mode="mode"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <UnitInput v-model="value.spec.resources.requests.storage" :mode="mode" :label="t('persistentVolumeClaim.capacity')" suffix="GiB" />
      </div>
      <div class="col span-6">
        <t class="text-label" k="persistentVolumeClaim.accessModes" />
        <div class="access-modes">
          <Checkbox :mode="mode" :value="value.spec.accessModes.includes('ReadWriteOnce')" label="Single-Node Read/Write" @input="e=>updateMode('ReadWriteOnce', e)" />
          <Checkbox :mode="mode" :value="value.spec.accessModes.includes('ReadMany')" label="Many-Node Read-Only" @input="e=>updateMode('ReadMany', e)" />
          <Checkbox :mode="mode" :value="value.spec.accessModes.includes('ReadWriteMany')" label="Many-Node Read/Write" @input="e=>updateMode('ReadWriteMany', e)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
    .access-modes {
        display: flex;
        flex-direction: row;
    }
</style>
