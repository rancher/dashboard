<script>
import HalfCircle from '@/components/graph/HalfCircle';
import SimpleBox from '@/components/SimpleBox';

export default {
  components: { HalfCircle, SimpleBox },
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
    units: {
      type:    String,
      default: ''
    }
  },
  computed: {
    percentage() {
      if (this.total === 0) {
        return 0;
      }

      return this.useful / this.total;
    },
    displayPercetange() {
      const integerPercentage = Math.round(this.percentage * 100);

      return `${ integerPercentage }%`;
    },
    color() {
      if (this.percentage >= 0.90) {
        return this.strokes('--gauge-error-primary', '--gauge-error-secondary');
      }

      if (this.percentage >= 0.75) {
        return this.strokes('--gauge-warning-primary', '--gauge-warning-secondary');
      }

      return this.strokes('--gauge-success-primary', '--gauge-success-secondary');
    }
  },
  methods: {
    maxDecimalPlaces(n) {
      return Math.round(n * 100) / 100;
    },

    strokes(primary, secondary) {
      return {
        primaryStrokeColor:           this.rgba(primary, 1),
        primaryStrokeGradientColor:   this.rgba(secondary, 1),
        secondaryStrokeColor:         this.rgba(primary, 0.1),
        secondaryStrokeGradientColor: this.rgba(secondary, 0.1)
      };
    },

    rgba(variable, opacity) {
      return `rgba(var(${ variable }), ${ opacity })`;
    }
  }
};
</script>

<template>
  <SimpleBox class="hardware-resource-gauge" :title="name">
    <div class="chart">
      <div class="half-circle-container">
        <HalfCircle
          :percentage="percentage"
          :primary-stroke-color="color.primaryStrokeColor"
          :primary-stroke-gradient-color="color.primaryStrokeGradientColor"
          :secondary-stroke-color="color.secondaryStrokeColor"
          :secondary-stroke-gradient-color="color.secondaryStrokeGradientColor"
        />
        <div class="percentage">
          {{ displayPercetange }}
        </div>
      </div>
    </div>
    <div class="of">
      {{ t('clusterIndexPage.hardwareResourceGauge.consumption', {useful: maxDecimalPlaces(useful), total: maxDecimalPlaces(total), units, suffix: name }) }}
    </div>
  </SimpleBox>
</template>

<style lang="scss">
    .hardware-resource-gauge {
        $spacing: 10px;
        $large-spacing: $spacing * 1.5;

        position: relative;
        display: flex;
        flex-direction: column;

        .chart .half-circle-container {
            position: relative;
            margin: $large-spacing auto 0 auto;
            padding-bottom: $large-spacing;
            max-width: 245px;
            height: 122.5px + $large-spacing;
            border-bottom: 2px solid var(--simple-box-divider);

            .percentage {
              position: absolute;
              bottom: 15px;
              text-align: center;
              width: 100%;

              font-size: 40px;
            }
        }

        .of {
            padding-top: $spacing;
            padding-bottom: $large-spacing;
            text-align: center;
        }
    }
</style>
