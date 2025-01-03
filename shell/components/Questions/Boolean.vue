<script>
import { Checkbox } from '@components/Form/Checkbox';
import Question from './Question';

export default {
  emits: ['update:value'],

  components: { Checkbox },
  mixins:     [Question]
};
</script>

<template>
  <div
    :data-testid="`boolean-row-${question.variable}`"
    class="row"
  >
    <div class="col span-6">
      <Checkbox
        :mode="mode"
        :label="displayLabel"
        :value="value"
        :disabled="disabled"
        :tooltip="displayTooltip"
        :data-testid="`boolean-input-${question.variable}`"
        @update:value="$emit('update:value', $event)"
      />
    </div>
    <div
      v-if="showDescription"
      :data-testid="`boolean-description-${question.variable}`"
      class="col span-6 mt-10"
    >
      {{ displayDescription }}
    </div>
  </div>
</template>
