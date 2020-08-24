<script>
import VolumeMount from '@/edit/workload/storage/volume-mount.js';
import Mount from '@/edit/workload/storage/Mount';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Checkbox from '@/components/form/Checkbox';
import { mapGetters } from 'vuex';
import PersistentVolumeClaim from '@/edit/PersistentVolumeClaim';
import { PVC } from '@/config/types';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    Mount,
    PersistentVolumeClaim,
    Checkbox
  },
  mixins: [VolumeMount],

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    String,
      default: null
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    // array of existing persistent volume claims
    pvcs: {
      type:    Array,
      default: () => []
    },

    registerBeforeHook: {
      type:    Function,
      default: null,
    },
  },

  async fetch() {
    const namespace = this.namespace || this.$store.getters['defaultNamespace'];

    const data = { type: PVC };

    data.metadata = { namespace };

    const pvc = await this.$store.dispatch('cluster/create', data);

    pvc.applyDefaults();

    this.pvc = pvc;
  },

  data() {
    return { pvc: {} };
  },

  computed: {
    // whether this is creating a new PVC or referencing an existing one
    createNew() {
      return this.value._type === 'createPVC';
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    namespace(neu) {
      this.pvc.metadata.namespace = neu;
    },

    'pvc.metadata.name'(neu) {
      this.value.persistentVolumeClaim.claimName = neu;
    }
  }
};
</script>

<template>
  <div>
    <button type="button" class="role-link btn btn-lg remove-vol" @click="$emit('remove')">
      <i class="icon icon-2x icon-x" />
    </button>
    <div class="bordered-section">
      <h3>{{ createNew ? t('generic.create') : '' }} {{ t('workload.storage.subtypes.persistentVolumeClaim') }}</h3>
      <div v-if="createNew" class="bordered-section">
        <PersistentVolumeClaim v-if="pvc.metadata" v-model="pvc" :register-before-hook="registerBeforeHook" :mode="mode" />
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput v-model="value.name" :required="true" :mode="mode" :label="t('workload.storage.volumeName')" @input="e=>updateMountNames(e)" />
        </div>
        <div class="col span-6">
          <LabeledSelect v-if="!createNew" v-model="value.persistentVolumeClaim.claimName" :label="t('workload.storage.subtypes.persistentVolumeClaim')" :options="pvcs" />
          <LabeledInput v-else-if="pvc.metadata" disabled :label="t('workload.storage.subtypes.persistentVolumeClaim')" :value="pvc.metadata.name" />
        </div>
      </div>
      <div class="row">
        <Checkbox v-model="value.persistentVolumeClaim.readOnly" :label="t('workload.storage.readOnly')" />
      </div>
    </div>
    <Mount v-model="volumeMounts" :name="value.name" :mode="mode" />
  </div>
</template>
