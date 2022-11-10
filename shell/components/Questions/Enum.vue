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
        :options="question.options"
        :placeholder="question.description"
        :required="question.required"
        :value="value"
        :disabled="disabled"
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
