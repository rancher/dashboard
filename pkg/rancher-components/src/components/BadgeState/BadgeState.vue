<script lang="ts">
import { PropType, defineComponent } from 'vue';

interface Badge {
  stateBackground: string;
  stateDisplay: string;
}

/**
 * Badge state component.
 * <p>Represents a badge whose label and color is either taken from the value property or
 * from the label and color properties. The state property takes precedence.</p>
 */
export default defineComponent({
  props: {
    /**
     * A value having the properties `stateBackground` and `stateDisplay`
     */
    value: {
      type:    Object as PropType<Badge>,
      default: null
    },

    /**
     * Badge color. `stateBackground` of the value property takes precedence if supplied
     */
    color: {
      type:    String,
      default: null
    },

    /**
     * Optional icon to be shown before the label
     */
    icon: {
      type:    String,
      default: null
    },

    /**
     * Label to display in the badge. `stateDisplay` of the value property takes precedence if supplied
     */
    label: {
      type:    String,
      default: null
    }
  },

  computed: {
    bg(): string | null {
      return this.value?.stateBackground || this.color;
    },

    msg(): string | null {
      return this.value?.stateDisplay || this.label;
    }
  }
});
</script>

<template>
  <span :class="['badge-state', bg]">
    <i
      v-if="icon"
      class="icon"
      :class="{[icon]: true, 'mr-5': !!msg}"
    />{{ msg }}
  </span>
</template>

<style lang="scss" scoped>
  .badge-state {
    align-items: center;
    display: inline-flex;
    padding: 2px 10px;
    border: 1px solid transparent;
    border-radius: 20px;

    &.bg-info {
      border-color: var(--info);
    }

    &.bg-error {
      border-color: var(--error);
    }

    &.bg-warning {
      border-color: var(--warning);
    }

    // Successful states are de-emphasized by using [text-]color instead of background-color
    &.bg-success {
      color: var(--success);
      background: transparent;
      border-color: var(--success);
    }

    // Added badge-disabled instead of bg-disabled since bg-disabled is used in other places with !important styling, an investigation is needed to make the naming consistent
    &.badge-disabled {
      color: var(--badge-state-disabled-text);
      background-color: var( --badge-state-disabled-bg);
      border: 1px solid var(--badge-state-disabled-border);
    }
  }
</style>
<style lang="scss">
  // TODO: #6005
  // Investigate why this is here.. I don't think that styles for sortable table should belong here
  .sortable-table TD .badge-state {
    @include clip;
    display: inline-block;
    max-width: 100%;
    position: relative;
    max-width: 110px;
    font-size: .85em;
    vertical-align: middle;
  }
</style>
