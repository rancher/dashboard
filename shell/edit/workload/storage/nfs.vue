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
            v-model="value.name"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.volumeName')"
          />
        </div>
        <div class="col span-6">
          <Checkbox
            v-model="value.nfs.readOnly"
            :mode="mode"
            :label="t('workload.storage.readOnly')"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model="value.nfs.path"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.path')"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.nfs.server"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.server')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
