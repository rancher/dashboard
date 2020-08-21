<script>
import Checkbox from '@/components/form/Checkbox';
import Question from './Question';

export default {
  components: { Checkbox },
  mixins:     [Question]
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <Checkbox
        :label="displayLabel"
        :value="value"
        @input="$emit('input', $event)"
      />
    </div>
    <div v-if="showDescription" class="col span-6 mt-10">
      {{ question.description }}
    </div>
  </div>
</template>
