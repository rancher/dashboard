<script>
import VStack from '@/components/Layout/Stack/VStack';

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');

  return d;
}

export default {
  name: 'PercentageCircle',

  components: { VStack },

  props: {
    value: {
      type:      Number,
      required:  true,
      validator: (value) => {
        return value >= 0 && value <= 1;
      }
    },
    lowerWarningBound: { type: Number, default: undefined },
    upperWarningBound: { type: Number, default: undefined },
    lowerErrorBound:   { type: Number, default: undefined },
    upperErrorBound:   { type: Number, default: undefined }
  },

  computed: {
    valueD() {
      return describeArc(50, 50, 45, 180, 180 + (360 * this.value));
    },
    printedValue() {
      return (this.value * 100)
        .toFixed(1)
        .replace(/\.0$/, '');
    },
    valueClass() {
      const errorClass = 'error';
      const warningClass = 'warning';
      const successClass = 'success';

      if (this.lowerErrorBound && this.value <= this.lowerErrorBound) {
        return errorClass;
      }

      if (this.lowerWarningBound && this.value <= this.lowerWarningBound) {
        return warningClass;
      }

      if (this.upperErrorBound && this.value >= this.upperErrorBound) {
        return errorClass;
      }

      if (this.upperWarningBound && this.value >= this.upperWarningBound) {
        return warningClass;
      }

      return successClass;
    }
  }
};
</script>

<template>
  <VStack class="percentage-circle" horizontal-align="center">
    <svg viewBox="0 0 100 100" class="gauge">
      <circle class="dial" fill="none" cx="50" cy="50" r="45" />
      <path v-if="value < 1" class="value" :class="valueClass" fill="none" :d="valueD" />
      <circle
        v-else
        class="value"
        :class="valueClass"
        fill="none"
        cx="50"
        cy="50"
        r="45"
      />
    </svg>
    <div class="printed-value mt-10">
      <h1>{{ printedValue }}%</h1>
    </div>
  </VStack>
</template>

<style lang="scss" scoped>
    .percentage-circle {
        text-align: center;

        svg {
            $size: 150px;
            width: $size;
            height: $size;

            .dial {
                stroke: var(--muted);
                stroke-width: 5;
            }

            .value {
                stroke-width: 5.5;
                stroke-linecap: round;

                &.success {
                    stroke: var(--success);
                }

                &.warning {
                    stroke: var(--warning);
                }

                &.error {
                    stroke: var(--error);
                }
            }
        }

        .printed-value {
            text-align: center;
        }
    }
</style>
