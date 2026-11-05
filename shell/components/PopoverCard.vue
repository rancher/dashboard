<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { ref, watch } from 'vue';
import {
  DEFAULT_FOCUS_TRAP_OPTS,
  useWatcherBasedSetupFocusTrapWithDestroyIncluded
} from '@shell/composables/focusTrap';
import RcButton from '@components/RcButton/RcButton.vue';

export interface Props {
  cardTitle: string;
  fallbackFocus?: string;
  showPopoverAriaLabel?: string;
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<Props>(), { fallbackFocus: 'body', showPopoverAriaLabel: 'Show more' });
const card = ref<any>(null);
const focusButton = ref<any>(null);
const popoverContainer = ref(null);
const showPopover = ref<boolean>(false);
const focusOpen = ref<boolean>(false);

// Set focus trap when card opened using keyboard
watch(
  () => card.value,
  (neu) => {
    if (neu && focusOpen.value) {
      const opts = {
        ...DEFAULT_FOCUS_TRAP_OPTS,
        fallbackFocus:  props.fallbackFocus,
        // Return focus to the button of this popover, not the first popover button on the page. focus-trap returns focus
        // after a delay, and an action like Edit YAML has navigated away by then. With the button gone there's nothing to
        // return to, and a selector matching no element makes focus-trap throw
        setReturnFocus: () => focusButton.value?.$el || false
      };

      useWatcherBasedSetupFocusTrapWithDestroyIncluded(() => showPopover.value, '#popover-card', opts);
    }
  }
);
</script>

<template>
  <div
    class="popover-card-base"
    :class="{open: showPopover}"
    @mouseleave="showPopover=false; focusOpen=false"
    @keydown.escape="showPopover=false; focusOpen=false"
  >
    <v-dropdown
      :triggers="[]"
      :container="popoverContainer"
      :shown="showPopover"
      placement="bottom-start"
    >
      <div
        class="popover-card-target"
        @mouseenter="showPopover=true"
      >
        <slot name="default" />
        <span class="focus-button-anchor">
          <RcButton
            ref="focusButton"
            variant="ghost"
            class="focus-button"
            :aria-label="props.showPopoverAriaLabel"
            aria-haspopup="true"
            :aria-expanded="showPopover"
            @click="showPopover=true; focusOpen=true;"
          >
            <i class="icon icon-chevron-down icon-sm" />
          </RcButton>
        </span>
        <div
          ref="popoverContainer"
          class="popover-card-container"
        >
          <!--Empty container for mounting popper content-->
        </div>
      </div>

      <template
        #popper
      >
        <slot name="card">
          <Card
            id="popover-card"
            ref="card"
            class="popover-card"
            :title="props.cardTitle"
          >
            <template #heading-action>
              <slot
                name="heading-action"
                :close="() => {showPopover=false; focusOpen=false;}"
              />
            </template>
            <slot name="card-body" />
          </Card>
        </slot>
      </template>
    </v-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.popover-card-base {
  position: relative;
  width: 100%;

  .popover-card {
    border: none;
  }

  .display-container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

  .display {
    display: inline-flex;
    max-width: 100%;
    a {
      flex: 1;
    }
  }

  .popover-card-target {
    height: 17px;
    display: inline-block;
  }

  // The button only gets a width when it's focused. Growing in the flow would widen the link's table cell and shift the
  // columns, so it's laid out from a zero-width anchor after the link and overlays the space next to it instead
  .focus-button-anchor {
    position: relative;
    display: inline-block;
    width: 0;
    height: 100%;
    vertical-align: top;
  }

  .rc-button.btn.focus-button {
    position: absolute;
    top: 50%;
    left: 4px;
    transform: translateY(-50%);
    padding: 0;
    width: 0px;
    height: initial;
    min-height: initial;
    overflow: hidden;
    border-width: 0;

    &:focus {
      width: initial;
      border-width: 1px;
    }
  }

  .popover-card-base {
    border: none;
  }

  .popover-card-container {
    position: absolute;
    $size: 10px;
    height: $size;
    bottom: -$size;
  }

  &.open .popover-card-container {
    width: 100%;
  }

  &:deep() {
    & > .v-popper > .btn.variant-link {
      padding: 0;
      min-height: initial;
      line-height: initial;

      &:hover {
        background: none;
      }
    }

    .popover-card-container > .v-popper__popper {
      border-radius: 6px;
      box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.04);

      // floating-vue leaves a 5px gap between the link and the card. Crossing it would fire mouseleave and close the
      // card, so fill it with an invisible strip on whichever side faces the link. The strip belongs to the card, so
      // the pointer never leaves it. It starts outside the card's 1px border (global .v-popper__popper rule) and spans
      // border + gap + 1px of overlap on the link, so sub-pixel positions can't leave a hole. Keep the overlap at 1px:
      // while the card is open the strip covers that edge of the link, and more would eat into its clickable area
      $bridge: 7px;

      &::before {
        content: '';
        position: absolute;
      }

      &[data-popper-placement^='bottom']::before,
      &[data-popper-placement^='top']::before {
        left: 0;
        right: 0;
        height: $bridge;
      }

      &[data-popper-placement^='left']::before,
      &[data-popper-placement^='right']::before {
        top: 0;
        bottom: 0;
        width: $bridge;
      }

      &[data-popper-placement^='bottom']::before {
        bottom: 100%;
      }

      &[data-popper-placement^='top']::before {
        top: 100%;
      }

      &[data-popper-placement^='left']::before {
        left: 100%;
      }

      &[data-popper-placement^='right']::before {
        right: 100%;
      }

      & > .v-popper__wrapper {
        .v-popper__arrow-container {
          display: none;
        }

        & > .v-popper__inner {
          overflow: initial;
          &, & > div > .dropdownTarget {
            padding: 0;
          }
        }
      }
    }
  }
}
</style>
