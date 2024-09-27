<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
  },

  props: {
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    },
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
      this.value.hostPath['type'] = '';
    }
  },

};
</script>
<template>
  <div>
    <div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.name"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.volumeName')"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.hostPath.path"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.nodePath')"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.hostPath.type"
            :mode="mode"
            :options="typeOpts"
            :label="t('workload.storage.hostPath.label')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
