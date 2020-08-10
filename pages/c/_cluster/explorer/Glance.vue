<script>
import GradientBox from '@/components/GradientBox';

export default {
  components: { GradientBox },
  props:      {
    provider: {
      type:     String,
      required: true
    },
    kubernetesVersion: {
      type:     String,
      required: true
    },
    totalNodes: {
      type:     Number,
      required: true
    },
    created: {
      type:     String,
      required: true
    }
  }
};
</script>

<template>
  <GradientBox class="glance" primary-color-var="--glance-bg-rgb" :show-tab="false">
    <div class="tile">
      <h1>{{ provider }}</h1>
      <label>{{ t('glance.provider') }}</label>
    </div>
    <div class="tile">
      <h1>{{ kubernetesVersion }}</h1>
      <label>{{ t('glance.version') }}</label>
    </div>
    <div class="tile">
      <h1>{{ totalNodes }}</h1>
      <label>{{ t('glance.nodes.total.label') }}</label>
    </div>
    <div class="tile">
      <h1><LiveDate :value="created" :add-suffix="true" :show-tooltip="true" /></h1>
      <label>{{ t('glance.age') }}</label>
    </div>
  </GradientBox>
</template>

<style lang="scss">
  .glance {
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      padding: 11px;

      .tile {
          display: flex;
          flex: 1;
          flex-direction: column;
          align-items: flex-start;
          padding: 9px 0 3px 0;

          &:not(:last-of-type) {
              border-right: 1px solid;
              border-color: var(--glance-divider);
          }

          &:not(:first-of-type) {
              padding-left: 20px;
          }
      }
      h1 {
        font-size: 15px;
        line-height: 3px;
      }

      @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
        h1 {
          font-size: 25px;
          line-height: 14px;
        }
      }
      @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
        h1 {
          font-size: 30px;
          line-height: 28px;
        }
      }

      label {
          font-size: 12px;
          opacity: 0.7;
      }
  }
</style>
