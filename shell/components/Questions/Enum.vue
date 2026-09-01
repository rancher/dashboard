<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Question from './Question';

export default {
  emits: ['update:value'],

  components: { LabeledSelect },
  mixins:     [Question],
  computed:   {
    options() {
      const options = this.question.options;

      if (Array.isArray(options)) {
        return options;
      }

      return Object.entries(options).map(([key, value]) => {
        return {
          value: key,
          label: value,
        };
      });
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledSelect
        :mode="mode"
        :label="displayLabel"
        :options="options"
        :placeholder="question.description"
        :required="question.required"
        :multiple="question.multiple"
        :value="value"
        :disabled="disabled"
        :tooltip="displayTooltip"
        :searchable="question.searchable"
        @update:value="$emit('update:value', $event)"
      />
    </div>
    <div
      v-if="showDescription"
      class="col span-6 mt-10"
    >
      {{ displayDescription }}
    </div>
  </div>
</template>
