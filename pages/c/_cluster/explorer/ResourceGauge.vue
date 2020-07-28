<script>
import GraphCircle from '@/components/graph/Circle';
import GradientBox from '@/components/GradientBox';

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
      type:     String,
      required: true
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
  <GradientBox class="resource-gauge" :class="{clickable}" :primary-color-var="primaryColorVar" @click.native="visitLocation()">
    <div class="graphical">
      <GraphCircle :primary-stroke-color="`rgba(var(${primaryColorVar}))`" secondary-stroke-color="rgb(var(--resource-gauge-back-circle))" :percentage="percentage" />
    </div>
    <div class="data">
      <h1>{{ useful }}</h1>
      <label>{{ name }}</label>
      <div class="alerts">
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
    .resource-gauge {
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
          font-size: 28px;
          line-height: 28px;
          border-bottom: 2px solid var(--gauge-divider);
          padding-bottom: $padding / 2;
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
            top: $padding / 2;

            .text-error {
              margin-left: 5px;
            }
        }
    }
</style>
