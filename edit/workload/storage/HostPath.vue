<script>
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Mount from '@/edit/workload/storage/Mount';
import VolumeMount from '@/edit/workload/storage/volume-mount.js';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
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

  computed: {
    typeOpts() {
      return [
        {
          label: this.t('workload.storage.hostPath.options.default'),
          value: ''
        },
        {
          label: this.t('workload.storage.hostPath.options.directoryOrCreate'),
          value: 'DirectoryOrCreate'
        },
        {
          label: this.t('workload.storage.hostPath.options.directory'),
          value: 'Directory'
        },
        {
          label: this.t('workload.storage.hostPath.options.fileOrCreate'),
          value: 'FileOrCreate'
        },
        {
          label: this.t('workload.storage.hostPath.options.file'),
          value: 'File'
        },
        {
          label: this.t('workload.storage.hostPath.options.socket'),
          value: 'Socket'
        },
        {
          label: this.t('workload.storage.hostPath.options.charDevice'),
          value: 'CharDevice'
        },
        {
          label: this.t('workload.storage.hostPath.options.blockDevice'),
          value: 'BlockDevice'
        },
      ];
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  created() {
    if (!this.value.hostPath.type) {
      this.$set(this.value.hostPath, 'type', '');
    }
  },

};
</script>
<template>
  <div>
    <button type="button" class="role-link btn btn-lg remove-vol" @click="$emit('remove')">
      <i class="icon icon-2x icon-x" />
    </button>
    <div class="bordered-section">
      <h3>{{ t('workload.storage.subtypes.hostPath') }}</h3>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput v-model="value.name" :required="true" :mode="mode" :label="t('workload.storage.volumeName')" @input="e=>updateMountNames(e)" />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput v-model="value.hostPath.path" :required="true" :mode="mode" :label="t('workload.storage.nodePath')" />
        </div>
        <div class="col span-6">
          <LabeledSelect v-model="value.hostPath.type" :options="typeOpts" :label="t('workload.storage.hostPath.label')" />
        </div>
      </div>
    </div>
    <Mount v-model="volumeMounts" :name="value.name" :mode="mode" />
  </div>
</template>
