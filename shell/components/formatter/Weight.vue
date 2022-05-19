<script>
import LabeledInput from '@shell/components/form/LabeledInput';

export default {
  components: { LabeledInput },

  props: {
    value: {
      type:     Number,
      default: 0,
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },

  data() {
    return { newPercent: null };
  },

  computed: {
    totalForApp() {
      return this.row.weightsOfApp;
    },

    desired() {
      const desired = this.row.weights.desired;
      const total = this.totalForApp.desired;

      if ( total === 0 ) {
        return 0;
      }

      return Math.round(desired / total * 1000) / 10;
    },

    current() {
      const current = this.row.weights.current;
      const total = this.totalForApp.current;

      if ( total === 0 ) {
        return 0;
      }

      return Math.round(current / total * 1000) / 10;
    },

    showDesired() {
      return this.current !== this.desired;
    },

    canAdjust() {
      return this.totalForApp.count > 1 && this.current !== 100;
    },

    newWeightValid() {
      const percent = this.newPercent;

      return percent >= 0 && percent <= 100;
    }
  },

  methods: {
    onShown() {
      setTimeout(() => {
        this.$refs.newPercent.focus();
      }, 250);
    },

    setWeight() {
      const newPercent = this.newPercent || 0;

      this.row.saveWeightPercent(newPercent);
    },
  }
};
</script>

<template>
  <v-popover
    :class="{'hand': canAdjust}"
    placement="top"
    :open-group="row.id"
    :trigger="canAdjust ? 'click' : 'manual'"
    offset="1"
    @apply-show="onShown"
  >
    <div>
      <span v-if="totalForApp.count === 1" class="text-muted">
        &mdash;
      </span>
      <span v-else v-trim-whitespace :class="{'text-muted': current === 0 && desired === 0}">
        {{ current }}%
      </span>
      <div v-if="showDesired">
        <i class="icon icon-chevron-right" />
        {{ desired }}%
      </div>
    </div>

    <template #popover>
      <div v-if="canAdjust" class="text-center pb-5">
        <form>
          <LabeledInput
            ref="newPercent"
            v-model.number="newPercent"
            label="Target"
            size="4"
            min="0"
            max="100"
            class="text-left"
            style="width: 100px;"
          >
            <template #suffix>
              <div class="addon">
                %
              </div>
            </template>
          </LabeledInput>
          <button type="submit" class="btn bg-primary btn-sm mt-20" :disabled="!newWeightValid" @click.stop.prevent="setWeight">
            Set
          </button>
        </form>
      </div>
    </template>
  </v-popover>
</template>
