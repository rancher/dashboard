<script>
import ArrayList from '@shell/components/form/ArrayList';
import Question from './Question';

export default {
  emits: ['update:value'],

  components: { ArrayList },
  mixins:     [Question],

  methods: {
    update(val) {
      this.$emit('update:value', val);
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <ArrayList
        :value="value"
        :title="question.label"
        :mode="mode"
        :disabled="disabled"
        :protip="displayTooltip"
        @update:value="update"
      />
    </div>
    <div
      v-if="showDescription"
      class="col span-6 mt-10"
    >
      {{ question.description }}
    </div>
  </div>
</template>
