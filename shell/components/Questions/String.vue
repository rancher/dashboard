<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import Question from './Question';

export default {
  emits: ['update:value'],

  components: { LabeledInput },
  mixins:     [Question],

  computed: {
    inputType() {
      if ( ['text', 'password', 'multiline'].includes(this.question.type) ) {
        return this.question.type;
      }

      return 'text';
    }
  }
};
</script>

<template>
  <div
    :data-testid="`string-row-${question.variable}`"
    class="row"
  >
    <div class="col span-6">
      <LabeledInput
        :mode="mode"
        :type="inputType"
        :label="displayLabel"
        :placeholder="question.default"
        :required="question.required"
        :value="value"
        :disabled="disabled"
        :tooltip="displayTooltip"
        :rules="rules"
        :data-testid="`string-input-${question.variable}`"
        @update:value="$emit('update:value', $event)"
      />
    </div>
    <div
      v-if="showDescription"
      :data-testid="`string-description-${question.variable}`"
      class="col span-6 mt-10"
    >
      {{ displayDescription }}
    </div>
  </div>
</template>
