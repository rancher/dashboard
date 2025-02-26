<script lang="ts">
import { defineComponent } from 'vue';
import { DEFAULT_FOCUS_TRAP_OPTS, useBasicSetupFocusTrap, getFirstFocusableElement } from '@shell/composables/focusTrap';

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
    }
  },
  computed: {
    modalWidth(): string {
      if (this.isValidWidth(this.width)) {
        const uom = typeof (this.width) === 'number' ? 'px' : '';

        return `${ this.width }${ uom }`;
      }

      return '600px';
    },
    stylesPropToObj(): object {
      return this.styles.split(';')
        .map((line) => line.trim().split(':'))
        .reduce((lines, [key, val]) => {
          return {
            ...lines,
            [key]: val
          };
        }, { });
    },
    modalStyles(): object {
      return {
        width: this.modalWidth,
        ...this.stylesPropToObj,
      };
    },
  },
  setup(props) {
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

      useBasicSetupFocusTrap('#modal-container-element', opts);
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleEscapeKey);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscapeKey);
  },
  methods: {
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
          @click.stop
        >
          <slot><!--Empty content--></slot>
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
