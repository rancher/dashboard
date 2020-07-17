<script>
export default {
  methods: {
    hasSlot(name = 'default') {
      return !!this.$slots[name] || !!this.$scopedSlots[name];
    }
  }
};
</script>
<template>
  <div class="dropdown-button-group">
    <div class="dropdown-button btn bg-primary p-0">
      <slot name="button-content">
        <button class="btn bg-transparent"></button>
      </slot>

      <v-popover
        v-if="hasSlot('popover-content')"
        placement="bottom"
        container=".dropdown-button-group"
        offset="10"
        :popper-options="{modifiers: { flip: { enabled: false } } }"
      >
        <slot name="button-toggle-content">
          <button class="icon-container btn bg-transparent">
            <i class="icon icon-chevron-down" />
          </button>
        </slot>

        <template slot="popover">
          <slot name="popover-content" />
        </template>
      </v-popover>
    </div>
  </div>
</template>

<style lang="scss">
  .dropdown-button-group {
    .v-popover {
      .text-right {
        margin-top: 5px;
      }
      .trigger {
        height: 100%;
        .icon-container {
          height: 100%;
          padding: 15px 10px 10px 10px;
        }
      }
    }
    .dropdown-button {
      background: var(--accent-btn);
      border: solid thin var(--link-text);
      color: var(--link-text);

      .create-button {
        &:not(:only-child) {
          border-right: 1px solid var(--link-text);
        }

        margin-top: 10px;
        margin-bottom: 10px;
        padding: 5px 40px;

        &:focus {
          outline: none;
        }
      }
    }
    .popover {
      border: none;
    }
    .tooltip {
      &[x-placement^="bottom"] {
        .tooltip-arrow {
          border-bottom-color: var(--dropdown-border);

          &:after {
            border-bottom-color: var(--dropdown-bg);
          }
        }
      }

      .tooltip-inner {
        color: var(--dropdown-text);
        background-color: var(--dropdown-bg);
        border: 1px solid var(--dropdown-border);
        padding: 0px;
        text-align: left;

        LI {
          padding: 10px 50px 10px 20px;

          &.divider {
            padding-top: 0px;
            padding-bottom: 0px;

            > .divider-inner {
              padding: 0;
              border-bottom: 1px solid var(--dropdown-divider);
              width: 125%;
              margin: 0 auto;
            }
          }

          &:not(.divider):hover {
            background-color: var(--dropdown-hover-bg);
            color: var(--dropdown-hover-text);
            cursor: pointer;
          }
        }

      }
    }
  }
</style>
