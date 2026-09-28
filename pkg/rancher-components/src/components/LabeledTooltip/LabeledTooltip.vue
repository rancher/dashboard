<script lang="ts">
import { defineComponent } from 'vue';
import { RcIconTooltip } from '@components/RcIconTooltip';
import { RcIconType } from '@components/RcIcon/types';

export default defineComponent({
  components: { RcIconTooltip },

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
    },
    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'labeledTooltip-info-icon'
    },
  },
  computed: {
    iconType(): RcIconType {
      return this.status === 'error' ? 'warning' : 'info';
    },
    iconAriaLabel(): string {
      if (this.status === 'error' || this.status === 'warning') {
        return this.t(`generic.${ this.status }`);
      }

      return this.t('generic.moreInfo');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tooltipContent(): {[key: string]: any} | string {
      if (this.isObject(this.value)) {
        return { ...{ content: this.value.content, popperClass: [`tooltip-${ status }`] }, ...this.value };
      }

      return this.value || '';
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
      <rc-icon-tooltip
        :content="tooltipContent"
        :label="iconAriaLabel"
        :icon-type="iconType"
        :class="{'hover':!value}"
        class="status-icon"
        :data-testid="componentTestid"
        @click.stop
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

<style lang='scss' scoped>
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
</style>
