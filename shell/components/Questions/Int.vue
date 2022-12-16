<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import Question from './Question';

//  @TODO valid_chars, invalid_chars

export default {
  components: { LabeledInput },
  mixins:     [Question]
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <LabeledInput
        type="text"
        :mode="mode"
        :label="displayLabel"
        :placeholder="question.default"
        :required="question.required"
        :value="value"
        :disabled="disabled"
        @input="val = parseInt($event, 10); if ( !isNaN(val) ) { $emit('input', val) }"
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
