<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Card from '@shell/components/Resource/Detail/Card/index.vue';

export default {
  components: { ConsumptionGauge, Card },
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

    usedTitle: {
      type:    String,
      default: null
    },

    reserved: {
      type:    Object,
      default: null
    },

    reservedTitle: {
      type:    String,
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
  <Card
    class="hardware-resource-gauge"
    :title="name"
  >
    <div class="hw-gauges mmb-1">
      <div
        v-if="reserved && (reserved.total !== undefined || reserved.useful !== undefined)"
        class="hw-gauge"
      >
        <ConsumptionGauge
          :capacity="reserved.total"
          :used="reserved.useful"
          :color-stops="colorStops"
          bar-size="small"
        >
          <template #title>
            <span>
              {{ reservedTitle ?? t('clusterIndexPage.hardwareResourceGauge.reserved') }}
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
      <div
        v-if="used && used.useful !== undefined"
        class="hw-gauge"
      >
        <ConsumptionGauge
          :capacity="used.total"
          :used="used.useful"
          :color-stops="colorStops"
          bar-size="small"
        >
          <template #title>
            <span>
              {{ usedTitle ?? t('clusterIndexPage.hardwareResourceGauge.used') }}
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
  </Card>
</template>

<style lang="scss" scoped>
  .hardware-resource-gauge {
    .hw-gauges {
      display: flex;
      flex-direction: column;
      gap: var(--gap-lg);
    }

    .values {
      font-size: 12px;
      padding-left: 10px;
    }
  }
</style>
