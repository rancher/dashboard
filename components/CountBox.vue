<script>
import GradientBox from '@/components/GradientBox';

export default {
  components: { GradientBox },
  props:      {
    name: {
      type:     String,
      required: true
    },
    count: {
      type:     Number,
      required: true
    },
    primaryColorVar: {
      type:     String,
      required: true
    },
  },
};
</script>

<template>
  <GradientBox class="count" :primary-color-var="primaryColorVar">
    <div class="data">
      <h1>{{ count }}</h1>
      <label>{{ name }}</label>
    </div>
  </GradientBox>
</template>

<style lang="scss" scoped>
    .count {
      $padding: 10px;

      padding: $padding;
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;

      .data {
        display: flex;
        flex-direction: column;
        flex: 1;

        label {
          opacity: 0.7;
        }
      }

      h1 {
        font-size: 40px;
        line-height: 36px;
        border-bottom: 1px solid var(--gauge-divider);
        padding-bottom: $padding / 2;
      }

      @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
        h1 {
          font-size: 40px;
          line-height: 36px;
        }
      }
    }
</style>
