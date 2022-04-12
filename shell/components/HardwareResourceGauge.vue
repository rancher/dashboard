<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import SimpleBox from '@shell/components/SimpleBox';

export default {
  components: { ConsumptionGauge, SimpleBox },
  props:      {
    name: {
      type:     String,
      required: true
    },

    units: {
      type:    String,
      default: ''
    },

    used: {
      type:    Object,
      default: null
    },

    reserved: {
      type:    Object,
      default: null
    }
  },
  computed: {
    colorStops() {
      return {
        0: '--success', 30: '--warning', 70: '--error'
      };
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
    },

    percentage(resource) {
      if (resource.total === 0) {
        return 0;
      }

      return `${ (resource.useful / resource.total * 100).toFixed(2) }%`;
    }
  }
};
</script>

<template>
  <SimpleBox class="hardware-resource-gauge">
    <div class="chart">
      <h3>
        {{ name }}
      </h3>
      <div v-if="reserved && (reserved.total || reserved.useful)" class="hw-gauge">
        <ConsumptionGauge
          :capacity="reserved.total"
          :used="reserved.useful"
          :color-stops="colorStops"
        >
          <template #title>
            <span>
              {{ t('clusterIndexPage.hardwareResourceGauge.reserved') }}
              <span class="values text-muted">
                <span v-if="reserved.formattedUseful">
                  {{ reserved.formattedUseful }}
                </span>
                <span v-else>
                  {{ maxDecimalPlaces(reserved.useful) }}
                </span>
                /
                <span v-if="reserved.formattedTotal">
                  {{ reserved.formattedTotal }}
                </span>
                <span v-else>
                  {{ maxDecimalPlaces(reserved.total) }} {{ reserved.units }}
                </span>
              </span>
            </span>
            <span>
              {{ percentage(reserved) }}
            </span>
          </template>
        </ConsumptionGauge>
      </div>
      <div v-if="used && used.useful" class="hw-gauge">
        <ConsumptionGauge
          :capacity="used.total"
          :used="used.useful"
          :color-stops="colorStops"
        >
          <template #title>
            <span>
              {{ t('clusterIndexPage.hardwareResourceGauge.used') }}
              <span class="values text-muted">
                <span v-if="used.formattedUseful">
                  {{ used.formattedUseful }}
                </span>
                <span v-else>
                  {{ maxDecimalPlaces(used.useful) }}
                </span>
                /
                <span v-if="used.formattedTotal">
                  {{ used.formattedTotal }}
                </span>
                <span v-else>
                  {{ maxDecimalPlaces(used.total) }} {{ used.units }}
                </span>
              </span>
            </span>
            <span>
              {{ percentage(used) }}
            </span>
          </template>
        </ConsumptionGauge>
      </div>
    </div>
  </SimpleBox>
</template>

<style lang="scss" scoped>
  .hardware-resource-gauge {
    $spacing: 10px;
    $large-spacing: $spacing * 1.5;

    position: relative;
    display: flex;
    flex-direction: column;

    .hw-gauge:not(:first-of-type) {
      margin-top: 20px;
    }

    .values {
      font-size: 12px;
      padding-left: 10px;
    }
  }
</style>
