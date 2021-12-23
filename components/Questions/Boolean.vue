<script>
import Question from './Question';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: { Checkbox },
  mixins:     [Question]
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <Checkbox
        :mode="mode"
        :label="displayLabel"
        :value="value"
        :disabled="disabled"
        @input="$emit('input', $event)"
      />
    </div>
    <div v-if="showDescription" class="col span-6 mt-10">
      {{ question.description }}
    </div>
  </div>
</template>
