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
import { get } from '@/utils/object';
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
    const spec = this.value.spec;

    if (!this.value.metadata) {
      this.$set(this.value, 'metadata', {});
    }

    this.$set(this.value.spec, 'accessModes', this.value.spec.accessModes || []);

    return {
      storageClasses: [], persistentVolumes: [], createPV: true, spec
    };
  },

  computed: {
    storageClassNames() {
      return this.storageClasses.map(sc => sc.metadata.name);
    },

    availablePVs() {
      return this.persistentVolumes.reduce((total, each) => {
        if (each?.status?.phase === 'Available') {
          total.push(each);
        }

        return total;
      }, []);
    },

    persistentVolumeNames() {
      return this.availablePVs.map(pv => pv.metadata.name);
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    createPV(neu, old) {
      if (neu) {
        delete this.spec.volumeName;
        this.spec.resources.requests.storage = null;
      } else {
        this.spec.storageClassName = '';
        this.spec.resources.requests.storage = null;
      }
    }
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

    updatePV(pv) {
      this.$set(this.spec, 'volumeName', pv.metadata.name);
      this.$set(this.spec, 'storageClassName', (pv.spec.storageClassName || ''));
      this.spec.resources.requests.storage = pv?.spec?.capacity?.storage;
    },

    updateStorage(neu = '') {
      if (!neu.toString().match(/[0-9]*[a-zA-Z]+$/)) {
        neu += 'Gi';
      }

      this.spec.resources.requests.storage = neu;
    },

    volumeName(vol) {
      return get(vol, 'metadata.name') || vol;
    }

  }

};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.metadata.name" :mode="mode" :required="true" :label="t('persistentVolumeClaim.volumeName')" @input="$emit('input', value)" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model="createPV"
          name="createPV"
          :options="[true, false]"
          :labels="[t('persistentVolumeClaim.source.options.new'), t('persistentVolumeClaim.source.options.existing')]"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect v-if="createPV" v-model="spec.storageClassName" :mode="mode" :label="t('persistentVolumeClaim.storageClass')" :options="storageClassNames" />
        <LabeledSelect
          v-else
          :value="spec.volumeName"
          :get-option-label="volumeName"
          :mode="mode"
          :label="t('persistentVolumeClaim.volumes')"
          :options="availablePVs"
          @input="updatePV"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <t class="text-label" k="persistentVolumeClaim.accessModes" />
        <div class="access-modes">
          <Checkbox :mode="mode" :value="value.spec.accessModes.includes('ReadWriteOnce')" label="Single-Node Read/Write" @input="e=>updateMode('ReadWriteOnce', e)" />
          <Checkbox :mode="mode" :value="value.spec.accessModes.includes('ReadOnlyMany')" label="Many-Node Read-Only" @input="e=>updateMode('ReadOnlyMany', e)" />
          <Checkbox :mode="mode" :value="value.spec.accessModes.includes('ReadWriteMany')" label="Many-Node Read/Write" @input="e=>updateMode('ReadWriteMany', e)" />
        </div>
      </div>
      <div v-if="createPV" class="col span-6">
        <UnitInput :value="spec.resources.requests.storage" :mode="mode" :label="t('persistentVolumeClaim.capacity')" suffix="GiB" @input="updateStorage" />
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
