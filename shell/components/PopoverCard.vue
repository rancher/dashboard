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
        setReturnFocus: () => '.focus-button'
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
        <RcButton
          variant="ghost"
          class="focus-button"
          :aria-label="props.showPopoverAriaLabel"
          aria-haspopup="true"
          :aria-expanded="showPopover"
          @click="showPopover=true; focusOpen=true;"
        >
          <i class="icon icon-chevron-down icon-sm" />
        </RcButton>
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

  .rc-button.btn.focus-button {
    margin-left: 4px;
    margin-right: 2px;
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
