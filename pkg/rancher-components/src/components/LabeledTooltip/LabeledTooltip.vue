<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
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
    iconClass(): string {
      return this.status === 'error' ? 'icon-warning' : 'icon-info';
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tooltipContent(): {[key: string]: any} | string {
      if (this.isObject(this.value)) {
        return {
          ...{ content: this.value.content, popperClass: [`tooltip-${ status }`] }, ...this.value, triggers: ['hover', 'touch', 'focus']
        };
      }

      return this.value ? { content: this.value, triggers: ['hover', 'touch', 'focus'] } : '';
    }
  },
  methods: {
    isObject(value: string | Record<string, unknown>): value is Record<string, unknown> {
      return typeof value === 'object' && value !== null && !!value.content;
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
        v-clean-tooltip="tooltipContent"
        v-stripped-aria-label="isObject(value) ? value.content : value"
        :class="{'hover':!value, [iconClass]: true}"
        class="icon status-icon"
        tabindex="0"
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

    @mixin tooltipColors($color) {
        .status-icon {
            color: $color;
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
.v-popper__popper.v-popper--theme-tooltip {
  .v-popper__inner {
    pre {
      padding: 2px;
      vertical-align: middle;
    }
  }
}
</style>
