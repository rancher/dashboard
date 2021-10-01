<script>
export default {
  methods: {
    hasSlot(name = 'default') {
      return !!this.$slots[name] || !!this.$scopedSlots[name];
    },
  }
};
</script>
<template>
  <div class="dropdown-button-group">
    <div
      class="dropdown-button bg-primary"
    >
      <v-popover
        v-if="hasSlot('popover-content')"
        id="navDropdown"
        placement="bottom-start"
        :container="false"
      >
        <slot name="button-content">
          <button
            ref="popoverButton"
            class="icon-container bg-primary no-left-border-radius full-width"
            type="button"
          >
            Button <i class="icon icon-chevron-down" />
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
  margin: 1rem;
  width: calc(100% - 2rem);

  button {
    width: 100%;
  }

  .btn {
    line-height: normal;
    border: 0px;
  }

  // this matches the top/bottom padding of the default button
  $trigger-padding: 15px 10px 15px 10px;

  .v-popover {
    width: 100%;
    .text-right {
      margin-top: 5px;
    }
    .trigger {
      width: 100%;
      height: 100%;
      .icon-container {
        height: 100%;
        padding: 10px 10px 10px 10px;
        i {
          transform: scale(1);
        }
        &:focus {
          outline-style: none;
          box-shadow: none;
          border-color: transparent;
        }
      }
    }
  }

  .dropdown-button {
    border-radius: 4px;
    width: 100%;
    background: var(--tooltip-bg);
    color: var(--link-text);
    padding: 0;
    display: inline-flex;

    .wrapper-content {
      button {
        border-right: 0px;
      }
    }

    &>*, .icon-chevron-down {
      color: var(--primary);
      background-color: rgba(0,0,0,0);
    }

    &.bg-primary:hover {
      background: var(--accent-btn-hover);
    }

    &.one-action {
      position: relative;
      &>.btn {
        padding: 15px 35px 15px 15px;
      }
      .v-popover{
        width: 100%;
        .trigger{
          position: absolute;
          top: 0px;
          right: 0px;
          left: 0px;
          bottom: 0px;
          BUTTON {
            position: absolute;
            right: 0px;
          }
        }
      }
    }
  }
  .popover {
    border: none;
  }
  .tooltip {
    margin-top: 0px;

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
      width: calc(100vw - 2.5rem);

      LI {
        padding: 0 10px !important;

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
