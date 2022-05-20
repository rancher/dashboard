<script>
import GradientBox from '@shell/components/GradientBox';

export default {
  components: { GradientBox },
  props:      {
    // array of slot names being used
    slots: {
      type:    Array,
      default: () => []
    }
  }
};
</script>

<template>
  <GradientBox :plain="true" class="glance" primary-color-var="--glance-bg-rgb" :show-tab="false">
    <div v-for="slot in slots" :key="slot" class="tile">
      <slot :name="slot" />
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
