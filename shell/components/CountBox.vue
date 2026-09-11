<script>

export default {
  name: 'CountBox',

  emits: ['click'],

  props: {
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
    },
    clickable: {
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
    },

    handleClick() {
      if (this.clickable) {
        this.$emit('click');
      }
    }
  }
};
</script>

<template>
  <div
    class="count-container"
    :class="{ 'clickable': clickable }"
    :style="sideStyle"
    @click="handleClick"
  >
    <div
      class="count"
      :primary-color-var="primaryColorVar"
      :style="mainStyle"
    >
      <div
        class="data"
        :class="{ 'compact': compact }"
      >
        <div class="count-value">
          {{ count }}
        </div>
        <label>{{ name }}</label>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
    .count-container {
      &.clickable {
        cursor: pointer;
      }
    }

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

          .count-value {
            margin-bottom: 0;
            padding-bottom: 0;
          }

          label {
            margin-left: 5px;
          }
        }
      }

      .count-value {
        @include h-css;

        font-size: 40px;
        line-height: 36px;
        padding-bottom: math.div($padding, 2);
        margin-bottom: 5px;
      }

      @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
        .count-value {
          font-size: 40px;
          line-height: 36px;
        }
      }
    }
</style>
