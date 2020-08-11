<script>
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import Mount from '@/edit/workload/storage/Mount';
import VolumeMount from '@/edit/workload/storage/volume-mount.js';

export default {
  components: {
    LabeledInput,
    Checkbox,
    Mount
  },

  mixins: [VolumeMount],

  props:  {
    mode: {
      type:    String,
      default: 'create'
    },

    // volume spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

};
</script>
<template>
  <div>
    <button type="button" class="role-link btn btn-lg remove-vol" @click="$emit('remove')">
      <i class="icon icon-2x icon-x" />
    </button>
    <div class="bordered-section">
      <h3>{{ t('workload.storage.subtypes.nfs') }}</h3>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput v-model="value.name" :required="true" :mode="mode" :label="t('workload.storage.volumeName')" @input="e=>updateMountNames(e)" />
        </div>
        <div class="col span-6">
          <Checkbox v-model="value.nfs.readOnly" :label="t('workload.storage.readOnly')" />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput v-model="value.nfs.path" :mode="mode" :label="t('workload.storage.path')" />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="value.nfs.server" :mode="mode" :label="t('workload.storage.server')" />
        </div>
      </div>
    </div>
    <Mount v-model="volumeMounts" :name="value.name" :mode="mode" />
  </div>
</template>
