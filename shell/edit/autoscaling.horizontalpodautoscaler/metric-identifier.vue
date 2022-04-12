<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import { convert, simplify } from '@shell/utils/selector'; /*  matching, */
import MatchExpressions from '@shell/components/form/MatchExpressions';

export default {
  components: { LabeledInput, MatchExpressions },
  props:      {
    value: {
      type:    Object,
      default: () => ({
        name:   '',
        target: {},
      }),
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
  computed: {
    matchExpressions: {
      get() {
        const selector = this.value?.selector;
        let matchExpressions;

        if (selector && selector?.matchExpressions) {
          matchExpressions = convert(
            selector?.matchLabels || {},
            selector.matchExpressions
          );

          return matchExpressions;
        } else {
          return [];
        }
      },
    },
  },
  methods: {
    matchChanged(expressions) {
      const { matchLabels, matchExpressions } = simplify(expressions);

      this.$set(this.value.selector, 'matchLabels', matchLabels);
      this.$set(this.value.selector, 'matchExpressions', matchExpressions);
    },
  },
};
</script>

<template>
  <div class="col span-12">
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.name"
          :mode="mode"
          :label="t('hpa.metricIdentifier.name.label')"
          :required="true"
          :placeholder="t('hpa.metricIdentifier.name.placeholder')"
          type="text"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <h3>Metric Selector</h3>
        <MatchExpressions
          :mode="mode"
          :value="matchExpressions"
          :label="t('hpa.metricIdentifier.selector.label')"
          :show-remove="false"
          @input="matchChanged($event)"
        />
      </div>
    </div>
  </div>
</template>
