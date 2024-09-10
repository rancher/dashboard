<script>
import GraphCircle from '@shell/components/graph/Circle';
import GradientBox from '@shell/components/GradientBox';

export default {
  components: { GradientBox, GraphCircle },
  props:      {
    name: {
      type:     String,
      required: true
    },
    total: {
      type:     Number,
      required: true
    },
    useful: {
      type:     Number,
      required: true
    },
    primaryColorVar: {
      type:    String,
      default: null,
    },
    warningCount: {
      type:    Number,
      default: 0
    },
    errorCount: {
      type:    Number,
      default: 0
    },
    location: {
      type:    Object,
      default: null
    },
    plain: {
      type:    Boolean,
      default: false
    },
    graphical: {
      type:    Boolean,
      default: true
    }
  },

  computed: {
    percentage() {
      if (this.total === 0) {
        return 0;
      }

      return this.useful / this.total;
    },
    clickable() {
      return !!this.location;
    },
    showAlerts() {
      const total = this.warningCount + this.errorCount;

      return total > 0;
    }
  },
  methods: {
    visitLocation() {
      if (!this.clickable) {
        return;
      }

      this.$router.push(this.location);
    }
  }
};
</script>

<template>
  <GradientBox
    class="count-gauge"
    :class="{clickable}"
    :primary-color-var="primaryColorVar"
    :plain="plain"
    @click="visitLocation()"
  >
    <div
      v-if="graphical"
      class="graphical"
    >
      <GraphCircle
        v-if="percentage > 0"
        :primary-stroke-color="`rgba(var(${primaryColorVar}))`"
        secondary-stroke-color="rgb(var(--resource-gauge-back-circle))"
        :percentage="percentage"
      />
      <GraphCircle
        v-if="percentage === 0"
        :primary-stroke-color="`rgba(var(${primaryColorVar}))`"
        secondary-stroke-color="rgb(var(--resource-gauge-back-circle))"
        class="zero"
        :percentage="100"
      />
    </div>
    <div class="data">
      <h1>{{ useful }}</h1>
      <label>{{ name }}</label>
      <div
        v-if="showAlerts"
        class="alerts"
      >
        <span class="text-warning">
          <i class="icon icon-warning" /><span class="count">{{ warningCount }}</span>
        </span>
        <span class="text-error">
          <i class="icon icon-error" /><span class="count">{{ errorCount }}</span>
        </span>
      </div>
    </div>
  </GradientBox>
</template>

<style lang="scss">
    .zero {
      circle {
        stroke: var(--gauge-zero);
      }
    }
    .count-gauge {
        $padding: 10px;

        padding: $padding;
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;

        &.clickable {
          cursor: pointer;
        }

        .data {
          display: flex;
          flex-direction: column;
          flex: 1;

          label {
            opacity: 0.7;
          }
        }

        .graphical {
          $size: 40px;
          width: $size;
          height: $size;
          margin-right: $padding;
        }

        h1 {
          font-size: 40px;
          line-height: 36px;
          padding-bottom: math.div($padding, 2);
          margin-bottom: 0;
        }

        @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
          h1 {
            font-size: 40px;
            line-height: 36px;
          }
        }

        .alerts {
            position: absolute;
            right: $padding;
            top: math.div($padding, 2);
            font-size: 15px;

            .text-error {
              margin-left: 5px;
            }
        }
    }
</style>
