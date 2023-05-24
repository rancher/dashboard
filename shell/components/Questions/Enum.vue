<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Question from './Question';

export default {
  components: { LabeledSelect },
  mixins:     [Question]
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledSelect
        :mode="mode"
        :label="displayLabel"
        :options="Array.isArray(question.options) ? question.options : Object.keys(question.options).map((key) => {
          return {
            value: key,
            label: question.options[key],
          };
        })"
        :placeholder="question.description"
        :required="question.required"
        :multiple="question.multiple"
        :value="value"
        :disabled="disabled"
        :tooltip="displayTooltip"
        :searchable="question.searchable"
        @input="$emit('input', $event)"
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
