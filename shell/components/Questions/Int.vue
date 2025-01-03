<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import Question from './Question';

export default {
  emits: ['update:value'],

  components: { LabeledInput },
  mixins:     [Question]
};
</script>

<template>
  <div
    :data-testid="`int-row-${question.variable}`"
    class="row"
  >
    <div class="col span-6">
      <LabeledInput
        type="text"
        :mode="mode"
        :label="displayLabel"
        :placeholder="question.default"
        :required="question.required"
        :value="value"
        :disabled="disabled"
        :tooltip="displayTooltip"
        :rules="rules"
        :data-testid="`int-input-${question.variable}`"
        @update:value="val = parseInt($event, 10); if ( !isNaN(val) ) { $emit('update:value', val) }"
      />
    </div>
    <div
      v-if="showDescription"
      :data-testid="`int-description-${question.variable}`"
      class="col span-6 mt-10"
    >
      {{ displayDescription }}
    </div>
  </div>
</template>
