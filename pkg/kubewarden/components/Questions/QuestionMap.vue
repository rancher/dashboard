<script>
import KeyValue from '../form/KeyValue';
import Question from './Question';

export default {
  name:       'QuestionMap',
  components: { KeyValue },
  mixins:     [Question],

  computed: {
    protip() {
      if ( this.question.tooltip ) {
        return this.question.tooltip;
      }

      return false;
    }
  },

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
          :protip="protip"
          :disabled="disabled"
          @input="update"
        />
      </div>
    </div>
  </div>
</template>
