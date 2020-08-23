<script>
export default {
  props: {
    value: {
      type:    String,
      default: null
    },
    status: {
      type:    String,
      default: 'error'
    }
  },
};
</script>

<template>
  <div ref="container" class="labeled-tooltip" :class="{[status]: true}">
    <i class="icon icon-info status-icon" />
    <div class="tooltip" x-placement="bottom">
      <div class="tooltip-arrow" />
      <div class="tooltip-inner">
        {{ value }}
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
.labeled-tooltip {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;

    .status-icon {
        position:  absolute;
        right: 26px;
        top: 16px;
        font-size: 20px;
    }

    .tooltip {
        position: absolute;
        width: calc(100% + 2px);
        top: calc(100% + 6px);

        .tooltip-arrow {
            right: 30px;
        }

        .tooltip-inner {
            padding: 10px;
        }
    }

    @mixin tooltipColors($color) {
        .status-icon {
            color: $color;
        }
        .tooltip {
            .tooltip-inner {
                color: var(--input-bg);
                background: $color;
                border-color: $color;
            }

            .tooltip-arrow {
                border-bottom-color: $color;
                &:after {
                    border: none;
                }
            }
        }
    }

    &.error {
        @include tooltipColors(var(--error));
    }

    &.warning {
        @include tooltipColors(var(--warning));
    }

    &.success {
        @include tooltipColors(var(--success));
    }
}
</style>
