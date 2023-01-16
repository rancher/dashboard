<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';

import { mapGetters } from 'vuex';

export default {
  components: {
    LabeledSelect, Checkbox, LabeledInput
  },

  props: {
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },

  computed: {
    driverComponent() {
      try {
        return require(`@shell/edit/workload/storage/csi/${ this.value.csi.driver }`).default;
      } catch {
        return null;
      }
    },

    driverOpts() {
      return require.context('@shell/edit/workload/storage/csi', true, /^.*\.vue$/).keys().map(path => path.replace(/(\.\/)|(.vue)/g, '')).filter(file => file !== 'index');
    },

    ...mapGetters({ t: 'i18n/t' })
  },
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
            v-model="value.csi.readOnly"
            :mode="mode"
            :label="t('workload.storage.readOnly')"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.csi.driver"
            :mode="mode"
            :label="t('workload.storage.driver')"
            :options="driverOpts"
            :get-option-label="opt=>t(`workload.storage.csi.drivers.'${opt}'`)"
            :required="true"
          />
        </div>
      </div>
      <div
        v-if="driverComponent"
        class="mb-10"
      >
        <component
          :is="driverComponent"
          v-model="value.csi.volumeAttributes"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
