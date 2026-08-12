<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { _EDIT } from '@shell/config/query-params';
import { DURATION_UNITS, DurationUnit, durationToParts, partsToDuration } from '../utils/duration';

/**
 * Value/unit pair bound to a single Go duration string. Emits `undefined` when cleared so the
 * caller can drop the field from the spec rather than persisting an empty string.
 */
export default defineComponent({
  name:       'DurationInput',
  components: { LabeledInput, LabeledSelect },

  props: {
    value: {
      type:    String as PropType<string | undefined>,
      default: undefined,
    },
    label: {
      type:    String,
      default: '',
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    tooltip: {
      type:    String,
      default: undefined,
    },
  },

  emits: ['update:value'],

  data() {
    const parts = durationToParts(this.value);

    return {
      amount: parts ? String(parts.value) : '',
      unit:   (parts?.unit || 'd') as DurationUnit,
    };
  },

  computed: {
    unitOptions() {
      return DURATION_UNITS.map((unit) => ({ label: this.t(`certManager.duration.unit.${ unit }`), value: unit }));
    },
  },

  watch: {
    // Keep in step when the parent replaces the resource, e.g. after a save or a form reset.
    value(neu: string | undefined) {
      if (neu === partsToDuration(this.amount, this.unit)) {
        return;
      }

      const parts = durationToParts(neu);

      this.amount = parts ? String(parts.value) : '';
      this.unit = parts?.unit || 'd';
    },
  },

  methods: {
    update() {
      this.$emit('update:value', partsToDuration(this.amount, this.unit));
    },
  },
});
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput
        v-model:value="amount"
        type="number"
        min="0"
        :label="label"
        :mode="mode"
        :tooltip="tooltip"
        @update:value="update"
      />
    </div>
    <div class="col span-6">
      <LabeledSelect
        v-model:value="unit"
        :label="t('certManager.duration.unitLabel')"
        :options="unitOptions"
        :mode="mode"
        @update:value="update"
      />
    </div>
  </div>
</template>
