<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    /**
     * The Labeled Tooltip value.
     */
    value: {
      type:    [String, Object],
      default: null
    },

    /**
     * The status for the Labeled Tooltip. Controls the Labeled Tooltip class.
     * @values info, success, warning, error
     */
    status: {
      type:    String,
      default: 'error'
    },

    /**
     * Displays the Labeled Tooltip on mouse hover.
     */
    hover: {
      type:    Boolean,
      default: true
    }
  },
  computed: {
    iconClass() {
      return this.status === 'error' ? 'icon-warning' : 'icon-info';
    }
  }
});
</script>

<template>
  <div
    ref="container"
    class="labeled-tooltip"
    :class="{[status]: true, hoverable: hover}"
  >
    <template v-if="hover">
      <i
        v-clean-tooltip="value.content ? { ...{content: value.content, classes: [`tooltip-${status}`]}, ...value } : value"
        :class="{'hover':!value, [iconClass]: true}"
        class="icon status-icon"
      />
    </template>
    <template v-else>
      <i
        :class="{'hover':!value}"
        class="icon status-icon"
      />
      <div
        v-if="value"
        class="tooltip"
        x-placement="bottom"
      >
        <div class="tooltip-arrow" />
        <div class="tooltip-inner">
          {{ value }}
        </div>
      </div>
    </template>
  </div>
</template>

<style lang='scss'>
.labeled-tooltip {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;

    &.hoverable {
      height: 0%;
    }

     .status-icon {
        position:  absolute;
        right: 30px;
        top: $input-padding-lg;
        z-index: z-index(hoverOverContent);
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

        .status-icon {
          top: 7px;
          right: 5px;
        }
    }

    &.warning {
        @include tooltipColors(var(--warning));
    }

    &.success {
        @include tooltipColors(var(--success));
    }
}

// Ensure code blocks inside tootips don't look awful
.tooltip {
  .tooltip-inner {
    > pre {
      padding: 2px;
      vertical-align: middle;
    }
  }
}
</style>
