<script>

export default {
  name: 'CountBox',

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
    compact: {
      type:    Boolean,
      default: false
    }
  },
  computed: {
    sideStyle() {
      return `border-left: 9px solid ${ this.customizePrimaryColorOpacity(1) };`;
    },

    mainStyle() {
      return `border-color: ${ this.customizePrimaryColorOpacity(0.25) };`;
    }
  },

  methods: {
    customizePrimaryColorOpacity(opacity) {
      return `rgba(var(${ this.primaryColorVar }), ${ opacity })`;
    }
  }
};
</script>

<template>
  <div class="count-container" :style="sideStyle">
    <div class="count" :primary-color-var="primaryColorVar" :style="mainStyle">
      <div class="data" :class="{ 'compact': compact }">
        <h1>{{ count }}</h1>
        <label>{{ name }}</label>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
    .count {
      $padding: 10px;

      padding: $padding;
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      border-width: 2px;
      border-style: solid;
      border-left: 0;

      .data {
        display: flex;
        flex-direction: column;
        flex: 1;

        label {
          opacity: 0.7;
        }

        &.compact {
          align-items: center;
          flex-direction: row;

          h1 {
            margin-bottom: 0;
            padding-bottom: 0;
          }

          label {
            margin-left: 5px;
          }
        }
      }

      h1 {
        font-size: 40px;
        line-height: 36px;
        padding-bottom: math.div($padding, 2);
        margin-bottom: 5px;
      }

      @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
        h1 {
          font-size: 40px;
          line-height: 36px;
        }
      }
    }
</style>
