<script>
import ButtonGroup from '@shell/components/ButtonGroup';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: { ButtonGroup, LabeledSelect },
  props:      {
    value: {
      type:     Object,
      required: true,
    },
    hasSummaryAndDetail: {
      type:    Boolean,
      default: true,
    },
  },
  data() {
    return {
      range:        null,
      rangeOptions: [
        {
          label: this.t('generic.units.time.5m'),
          value: '5m',
        },
        {
          label: this.t('generic.units.time.1h'),
          value: '1h',
        },
        {
          label: this.t('generic.units.time.6h'),
          value: '6h',
        },
        {
          label: this.t('generic.units.time.1d'),
          value: '1d',
        },
        {
          label: this.t('generic.units.time.7d'),
          value: '7d',
        },
        {
          label: this.t('generic.units.time.30d'),
          value: '30d',
        },
      ],
      refreshOptions: [
        {
          label: this.t('generic.units.time.5s'),
          value: '5s',
        },
        {
          label: this.t('generic.units.time.10s'),
          value: '10s',
        },
        {
          label: this.t('generic.units.time.30s'),
          value: '30s',
        },
        {
          label: this.t('generic.units.time.1m'),
          value: '1m',
        },
        {
          label: this.t('generic.units.time.5m'),
          value: '5m',
        },
        {
          label: this.t('generic.units.time.15m'),
          value: '15m',
        },
        {
          label: this.t('generic.units.time.30m'),
          value: '30m',
        },
        {
          label: this.t('generic.units.time.1h'),
          value: '1h',
        },
        {
          label: this.t('generic.units.time.2h'),
          value: '2h',
        },
        {
          label: this.t('generic.units.time.1d'),
          value: '1d',
        }
      ],
      detailSummaryOptions: [
        {
          label: this.t('graphOptions.detail'),
          value: 'detail'
        },
        {
          label: this.t('graphOptions.summary'),
          value: 'summary'
        }
      ]
    };
  }
};
</script>

<template>
  <div class="graph-options">
    <div v-if="hasSummaryAndDetail">
      <ButtonGroup v-model="value.type" :options="detailSummaryOptions" />
    </div>
    <div v-else>
      <div />
    </div>
    <div class="range-refresh">
      <LabeledSelect v-model="value.range" :options="rangeOptions" :label="t('graphOptions.range')" />
      <LabeledSelect v-model="value.refreshRate" :options="refreshOptions" :label="t('graphOptions.refresh')" />
    </div>
  </div>
</template>

<style lang='scss' scoped>
.graph-options {
    &, .range-refresh {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
    }

    & {
      justify-content: space-between;
      align-items: center;
    }

    .labeled-select {
        width: 100px;
        margin-left: 10px;
    }
}
</style>
