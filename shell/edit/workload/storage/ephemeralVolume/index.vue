<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import Mount from '@shell/edit/workload/storage/Mount';
import { mapGetters } from 'vuex';

export default {
  components: {
    LabeledSelect, LabeledInput, Checkbox, Mount
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
        return require(`@shell/edit/workload/storage/ephemeralVolume/${ this.value.csi.driver }`).default;
      } catch {
        return null;
      }
    },

    driverOpts() {
      return require.context('@shell/edit/workload/storage/ephemeralVolume', true, /^.*\.vue$/).keys().map(path => path.replace(/(\.\/)|(.vue)/g, '')).filter(file => file !== 'index');
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <div>
    <button
      v-if="mode!=='view'"
      type="button"
      class="role-link btn btn-lg remove-vol"
      @click="$emit('remove')"
    >
      <i class="icon icon-2x icon-x" />
    </button>
    <div>
      <h3>{{ t('workload.storage.subtypes.csi') }}</h3>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            v-model="value.csi.driver"
            :mode="mode"
            :label="t('workload.storage.driver')"
            :options="driverOpts"
            :get-option-label="opt=>t(`workload.storage.csi.drivers.'${opt}'`)"
          />
        </div>
      </div>
      <div
        v-if="value.csi.driver && driverComponent"
        class="mb-10"
      >
        <component
          :is="driverComponent"
          :value="value.csi.volumeAttributes"
          :mode="mode"
        />
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.csi.fsType"
            :mode="mode"
            :label="t('workload.storage.csi.fsType')"
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
    </div>
    <div class="spacer" />
    <Mount
      :pod-spec="podSpec"
      :name="value.name"
      :mode="mode"
    />
  </div>
</template>
