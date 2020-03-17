<template>
  <div class="stack" :class="classes">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    direction: {
      type: String,
      validator(value) {
        return ['horizontal', 'vertical'].includes(value);
      },
      required: true
    },
    showDividers:    { type: Boolean },
    horizontalAlign: {
      type: String,
      validator(value) {
        return ['left', 'right', 'center', 'space-between', 'space-around', 'space-evenly'].includes(value);
      },
      default: undefined
    },
    verticalAlign: {
      type: String,
      validator(value) {
        return ['top', 'bottom', 'center', 'space-between', 'space-around', 'space-evenly'].includes(value);
      },
      default: undefined
    },
  },
  computed: {
    classes() {
      return {
        dividers:                this.showDividers,
        [this.direction]:        true,

        'h-align-left':          this.horizontalAlign === 'left',
        'h-align-right':         this.horizontalAlign === 'right',
        'h-align-center':        this.horizontalAlign === 'center',
        'h-align-space-between': this.horizontalAlign === 'space-between',
        'h-align-space-around':  this.horizontalAlign === 'space-around',
        'h-align-space-evenly':  this.horizontalAlign === 'space-evenly',

        'v-align-top':           this.verticalAlign === 'top',
        'v-align-bottom':        this.verticalAlign === 'bottom',
        'v-align-center':        this.verticalAlign === 'center',
        'v-align-space-between': this.verticalAlign === 'space-between',
        'v-align-space-around':  this.verticalAlign === 'space-around',
        'v-align-space-evenly':  this.verticalAlign === 'space-evenly',
      };
    }
  }
};
</script>

<style lang="scss" scoped>
    .stack {
        display: flex;

        &.horizontal {
            flex-direction: row;

            &.dividers {
                & > *:not(:last-child) {
                    border-right: 1px solid var(--border)
                }
            }

            &.h-align-left {
                justify-content: flex-start;
            }

            &.h-align-right {
                justify-content: flex-end;
            }

            &.h-align-center {
                justify-content: center;
            }

            &.h-align-space-between {
                justify-content: space-between;
            }

            &.h-align-space-around {
                justify-content: space-around;
            }

            &.h-align-space-evenly {
                justify-content: space-evenly;
            }

            &.v-align-top {
                align-items: flex-start;
            }

            &.v-align-bottom {
                align-items: flex-end;
            }

            &.v-align-center {
                align-items: center;
            }

            &.v-align-space-between {
                align-items: space-between;
            }

            &.v-align-space-around {
                align-items: space-around;
            }

            &.v-align-space-evenly {
                align-items: space-evenly;
            }
        }

        &.vertical {
            flex-direction: column;

            &.dividers {
                & > *:not(:last-child) {
                    border-bottom: 1px solid var(--border)
                }
            }

             &.h-align-left {
                align-items: flex-start;
            }

            &.h-align-right {
                align-items: flex-end;
            }

            &.h-align-center {
                align-items: center;
            }

            &.h-align-space-between {
                align-items: space-between;
            }

            &.h-align-space-around {
                align-items: space-around;
            }

            &.h-align-space-evenly {
                align-items: space-evenly;
            }

            &.v-align-top {
                justify-content: flex-start;
            }

            &.v-align-bottom {
                justify-content: flex-end;
            }

            &.v-align-center {
                justify-content: center;
            }

            &.v-align-space-between {
                justify-content: space-between;
            }

            &.v-align-space-around {
                justify-content: space-around;
            }

            &.v-align-space-evenly {
                justify-content: space-evenly;
            }
        }
    }
</style>
