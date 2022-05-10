<script>
import KeyValue from '@shell/components/form/KeyValue';
import Question from './Question';

export default {
  name:       'QuestionMap',
  components: { KeyValue },
  mixins:     [Question],

  methods: {
    update(val) {
      this.$emit('input', val);
    }
  }
};
</script>

<template>
  <div>
    <div v-if="showDescription" class="row mt-10">
      <div class="col span-12">
        {{ question.description }}
      </div>
    </div>
    <div class="row">
      <div class="col span-12 mt-10">
        <KeyValue
          :key="question.variable"
          v-model="value[question.variable]"
          :title="question.label"
          :mode="mode"
          :protip="false"
          :disabled="disabled"
          @input="update"
        />
      </div>
    </div>
  </div>
</template>
