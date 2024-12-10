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
      return require.context('@shell/edit/workload/storage/csi', true, /^.*\.vue$/).keys().map((path) => path.replace(/(\.\/)|(.vue)/g, '')).filter((file) => file !== 'index');
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    /**
    * Retrieves the label for a given option
    * @param option The option for which to retrieve the label. option can be
    * either a string or an object. If it is an object, is should have a `label`
    * property associated with it.
    */
    getOptionLabel(option) {
      if (typeof option === 'string') {
        return this.getOptionLabelString(option);
      }

      const { label } = option;

      return this.getOptionLabelString(label);
    },
    /**
    * Translates a given key into a localized string.
    * @param key The key to be translated.
    */
    getOptionLabelString(key) {
      // Periods are replaced with `-` to prevent conflict with the default key
      // separator.
      return this.t(`workload.storage.csi.drivers.'${ key.replaceAll('.', '-') }'`);
    }
  }
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
        <div class="col span-6">
          <Checkbox
            v-model:value="value.csi.readOnly"
            :mode="mode"
            :label="t('workload.storage.readOnly')"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            v-model:value="value.csi.driver"
            data-testid="workload-storage-driver"
            :mode="mode"
            :label="t('workload.storage.driver')"
            :options="driverOpts"
            :get-option-label="getOptionLabel"
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
          v-model:value="value.csi.volumeAttributes"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
