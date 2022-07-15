<script>
import { _CREATE, _VIEW } from '@shell/config/query-params';

import Values from './Values.vue';

export default {
  name: 'Config',

  props: {
    mode: {
      type:     String,
      default:  _VIEW
    },
    value: {
      type:     Object,
      required: true
    }
  },

  components: { Values },

  async fetch() {
    this.chartValues = {
      policy:    this.value,
      questions: null
    };

    let questionsJson = null;

    if ( this.value.spec?.settings ) {
      questionsJson = await this.value.policyQuestions();

      this.chartValues.questions = { questions: questionsJson };
    }
  },

  data() {
    return { chartValues: null };
  },

  computed: {
    // if coming from the "View Yaml" page `this.mode` will display `create` - this is not legit.
    legitMode() {
      if ( this.mode === _CREATE ) {
        return _VIEW;
      }

      return this.mode;
    }
  }
};
</script>

<template>
  <Values :value="value" :chart-values="chartValues" :mode="legitMode" />
</template>
