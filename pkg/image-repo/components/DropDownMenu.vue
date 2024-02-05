<script>
import IconOrSvg from '@shell/components/IconOrSvg';

export default {
  name:       'DropDownMenu',
  components: { IconOrSvg },
  props:      {
    options: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    componentTestid: {
      type:    String,
      default: 'action-menu'
    },
    placement: {
      type:    String,
      default: 'bottom-end'
    },
    propVisible: {
      type:    Boolean,
      default: false,
    },
    currentRow: {
      type:    Object,
      default: () => {},
    }
  },
  data() {
    return { innerVisible: false };
  },
  computed: {
    visible() {
      if (this.hasSlot) {
        return this.propVisible;
      }

      return this.innerVisible;
    },
    hasSlot() {
      return !!this.$slots.default;
    }
  },
  methods: {
    show() {
      if (!this.hasSlot) this.innerVisible = true;
    },
    hide() {
      if (!this.hasSlot) this.innerVisible = false;
      this.$emit('visible-change', false);
    },
    hasOptions(options) {
      return options.length !== undefined ? options.length : Object.keys(options).length > 0;
    },
    execute(action, event, args) {
      if (action.disabled) return;
      this.$emit('custom-event', {
        ...action,
        event,
        ...args,
        route: this.$route
      });
      this.innerVisible = false;
    },
  },
};
</script>

<template>
  <div class="drop-down-menu-cn">
    <v-popover
      :open="visible"
      trigger="manual"
      :placement="placement"
      popoverBaseClass="drop-down-menu-cn tooltip popover"
      @auto-hide="hide"
    >
      <slot name="default">
        <button
          class="btn btn-sm button-dropdown actions"
          @click.stop="show"
        >
          <i class="icon icon-actions" />
        </button>
      </slot>
      <template slot="popover">
        <ul
          class="list-unstyled menu"
        >
          <li
            v-for="(opt, i) in options"
            :key="opt.action"
            :disabled="opt.disabled || (opt?.disableActions && opt?.disableActions(currentRow))"
            :class="{divider: opt.divider}"
            :data-testid="componentTestid + '-' + i + '-item'"
            @click="execute(opt, $event)"
          >
            <IconOrSvg
              v-if="opt.icon || opt.svg"
              :icon="opt.icon"
              :src="opt.svg"
              class="icon"
              color="header"
            />
            <span v-clean-html="opt.label" />
          </li>
          <li
            v-if="!hasOptions(options)"
            class="no-actions"
          >
            <span v-t="'sortableTable.noActions'" />
          </li>
        </ul>
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss">
.drop-down-menu-cn {
  margin-top: 0px !important;
  .button-dropdown {
    background-color: transparent;
    color: var(--primary);
    border-radius: 2px;
    box-shadow: none;
    &:hover {
      background-color: var(--accent-btn);
      opacity: 1;
    }
    &:focus {
      background-color: var(--accent-btn);
      opacity: 1;
    }
  }
  .popover-inner {
    padding: 0px !important;
  }
  .tooltip-arrow {
    &::after {
      bottom: 0px !important;
    }
  }

  .menu {
    z-index: z-index('dropdownContent');
    min-width: 145px;
    color: var(--dropdown-text);
    LI {
      align-items: center;
      display: flex;
      padding: 8px 10px;
      margin: 0;
      &[disabled] {
        cursor: not-allowed  !important;
        color: var(--disabled-text);
      }
      &.divider {
        padding: 0;
        border-bottom: 1px solid var(--dropdown-divider);
      }
      &:not(.divider):hover {
        background-color: var(--dropdown-hover-bg);
        color: var(--dropdown-hover-text);
        cursor: pointer;
      }
      .icon {
        display: unset;
        width: 14px;
        text-align: center;
        margin-right: 8px;
      }
      &.no-actions {
        color: var(--disabled-text);
      }
      &.no-actions:hover {
        background-color: initial;
        color: var(--disabled-text);
        cursor: default;
      }
    }
  }
}
</style>
