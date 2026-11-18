<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: {
    LabeledInput,
    Checkbox,
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
    rules: {
      type:    Object,
      default: () => ({})
    },
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

};
</script>
<template>
  <div>
    <div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.name"
            :rules="rules.name"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.volumeName')"
          />
        </div>
        <div class="col span-6">
          <Checkbox
            v-model:value="value.nfs.readOnly"
            :mode="mode"
            :label="t('workload.storage.readOnly')"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.nfs.path"
            :rules="rules['nfs.path']"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.path')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.nfs.server"
            :rules="rules['nfs.server']"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.server')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
