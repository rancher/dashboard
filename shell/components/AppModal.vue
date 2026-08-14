<script lang="ts">
import { defineComponent, markRaw, ref, StyleValue } from 'vue';
import {
  DEFAULT_FOCUS_TRAP_OPTS,
  getFirstFocusableElement,
  useWatcherBasedSetupFocusTrapWithDestroyIncluded
} from '@shell/composables/focusTrap';
import { provideModalTitleId } from '@components/utils/modalTitle';

export const DEFAULT_ITERABLE_NODE_SELECTOR = 'body;';

export default defineComponent({
  name: 'AppModal',

  emits: ['close'],

  inheritAttrs: false,
  props:        {
    /**
     * If set to false, it will not be possible to close modal by clicking on
     * the background or by pressing Esc key.
     */
    clickToClose: {
      type:    Boolean,
      default: true,
    },
    /**
     * Width in pixels or percents (50, "50px", "50%").
     *
     * Supported string values are <number>% and <number>px
     */
    width: {
      type:    [Number, String],
      default: 600,
      validator(value) {
        if (typeof value === 'number') {
          return value > 0;
        }

        if (typeof value === 'string') {
          return /^(0*(?:[1-9][0-9]*|0)\.?\d*)+(px|%)$/.test(value);
        }

        return false;
      }
    },
    /**
     * List of class that will be applied to the modal window
     */
    customClass: {
      type:    String,
      default: '',
    },
    /**
     * Style that will be applied to the modal window
     */
    styles: {
      type:    String,
      default: '',
    },
    /**
     * Name of the modal
     */
    name: {
      type:    String,
      default: '',
    },
    /**
     * trigger focus trap
     */
    triggerFocusTrap: {
      type:    Boolean,
      default: false,
    },
    /**
     * forcefully set return focus element based on this selector
     */
    returnFocusSelector: {
      type:    String,
      default: '',
    },
    /**
     * will return focus to the first iterable node of this container select
     */
    returnFocusFirstIterableNodeSelector: {
      type:    String,
      default: DEFAULT_ITERABLE_NODE_SELECTOR,
    },
    /**
     * watcher-based focus trap variable to watch
     */
    focusTrapWatcherBasedVariable: {
      type:    Boolean,
      default: undefined,
    }
  },
  computed: {
    /**
     * An explicit `aria-labelledby` from the caller always wins. Otherwise the
     * generated title id is used, but only once something inside the modal has
     * actually rendered with it - a reference to a missing element would leave
     * the dialog with no accessible name at all.
     */
    labelledBy(): string | undefined {
      return (this.$attrs['aria-labelledby'] as string) || (this.hasTitle ? this.titleId : undefined);
    },
    modalWidth(): string {
      if (this.isValidWidth(this.width)) {
        const uom = typeof (this.width) === 'number' ? 'px' : '';

        return `${ this.width }${ uom }`;
      }

      return '600px';
    },
    stylesPropToObj(): Record<string, string> {
      return this.styles.split(';')
        .map((line) => line.trim().split(':'))
        .reduce((lines: Record<string, string>, [key, val]) => {
          return {
            ...lines,
            [key]: val
          };
        }, { });
    },
    modalStyles(): StyleValue {
      return {
        width: this.modalWidth,
        ...this.stylesPropToObj,
      };
    }
  },
  setup(props) {
    // made available to descendants (see Card) and to the default slot, so
    // whatever renders the modal's title can label the dialog with it
    const titleId = provideModalTitleId();

    if (props.triggerFocusTrap) {
      let opts:any = DEFAULT_FOCUS_TRAP_OPTS;

      // if we have a "returnFocusFirstIterableNodeSelector" on top of "returnFocusSelector"
      // then we will use "returnFocusFirstIterableNodeSelector" as a fallback of "returnFocusSelector"
      if (props.returnFocusFirstIterableNodeSelector && props.returnFocusFirstIterableNodeSelector !== DEFAULT_ITERABLE_NODE_SELECTOR && props.returnFocusSelector) {
        opts = {
          ...DEFAULT_FOCUS_TRAP_OPTS,
          setReturnFocus: () => {
            return document.querySelector(props.returnFocusSelector) ? props.returnFocusSelector : getFirstFocusableElement(document.querySelector(props.returnFocusFirstIterableNodeSelector));
          }
        };
      // otherwise, if we are sure of permanent existance of "returnFocusSelector"
      // we just return to that element
      } else if (props.returnFocusSelector) {
        opts = {
          ...DEFAULT_FOCUS_TRAP_OPTS,
          setReturnFocus: props.returnFocusSelector
        };
      }

      // prop used to immediately trigger the focus trap when a proper watch variable is not required
      const autoTriggerFocusTrapWatcher = ref(true);

      useWatcherBasedSetupFocusTrapWithDestroyIncluded(() => props.focusTrapWatcherBasedVariable ?? autoTriggerFocusTrapWatcher, '#modal-container-element', opts, true);
    }

    return { titleId };
  },
  data() {
    return {
      hasTitle:      false,
      titleObserver: null as MutationObserver | null,
    };
  },
  mounted() {
    document.addEventListener('keydown', this.handleEscapeKey);

    this.syncTitle();

    // slot content can render (or re-render) its title at any point after the
    // modal itself is mounted, so the check can't be a one-off
    const observer = markRaw(new MutationObserver(() => this.syncTitle()));

    observer.observe(this.$refs.modalRef as HTMLElement, { childList: true, subtree: true });
    this.titleObserver = observer;
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscapeKey);
    this.titleObserver?.disconnect();
  },
  methods: {
    /**
     * Track whether the title id handed to the slot, or claimed by a descendant
     * such as Card, has actually made it into the DOM
     */
    syncTitle() {
      const container = this.$refs.modalRef as HTMLElement | undefined;

      this.hasTitle = !!container?.querySelector(`[id="${ this.titleId }"]`);
    },
    handleClickOutside(event: MouseEvent) {
      if (
        this.clickToClose &&
        this.$refs.modalRef &&
        !(this.$refs.modalRef as HTMLElement).contains(event.target as Node)
      ) {
        this.$emit('close');
      }
    },
    handleEscapeKey(event: KeyboardEvent) {
      if (this.clickToClose && event.key === 'Escape') {
        this.$emit('close');
      }
    },
    isValidWidth(value: number | string) {
      if (typeof value === 'number') {
        return value > 0;
      }

      if (typeof value === 'string') {
        return /^(0*(?:[1-9][0-9]*|0)\.?\d*)+(px|%)$/.test(value);
      }

      return false;
    }
  }
});
</script>

<template>
  <teleport to="#modals">
    <transition
      name="modal-fade"
      appear
    >
      <div
        class="modal-overlay"
        :data-modal="name"
        @click="handleClickOutside"
      >
        <div
          v-bind="$attrs"
          id="modal-container-element"
          ref="modalRef"
          :class="customClass"
          class="modal-container"
          :style="modalStyles"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledBy"
          @click.stop
        >
          <slot :title-id="titleId">
            <!--Empty content-->
          </slot>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style lang="scss">
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--overlay-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: z-index('modalOverlay');

    .modal-container {
      background-color: var(--modal-bg);
      border-radius: var(--border-radius);
      max-height: 95vh;
      overflow: auto;
      border: 2px solid var(--modal-border);
    }
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 200ms;
  }

  .modal-fade-enter,
  .modal-fade-leave-to {
    opacity: 0;
  }
</style>
