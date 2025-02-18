<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useBasicSetupFocusTrap } from '@shell/composables/focusTrap';

export default defineComponent({

  name:  'Card',
  props: {
    /**
     * The card's title.
     */
    title: {
      type:    String,
      default: ''
    },
    /**
     * The text content for the card's body.
     */
    content: {
      type:    String,
      default: ''
    },
    /**
     * The function to invoke when the default action button is clicked.
     */
    buttonAction: {
      type:    Function as PropType<(event: MouseEvent) => void>,
      default: (): void => { }
    },
    /**
     * The text for the default action button.
     */
    buttonText: {
      type:    String,
      default: 'go'
    },
    /**
     * Toggles the card's highlight-border class.
     */
    showHighlightBorder: {
      type:    Boolean,
      default: true
    },
    /**
     * Toggles the card's Actions section.
     */
    showActions: {
      type:    Boolean,
      default: true
    },
    sticky: {
      type:    Boolean,
      default: false,
    },
    triggerFocusTrap: {
      type:    Boolean,
      default: false,
    },
  },
  setup(props) {
    if (props.triggerFocusTrap) {
      useBasicSetupFocusTrap('#focus-trap-card-container-element', {
        // needs to be false because of import YAML modal from header
        // where the YAML editor itself is a focus trap
        // and we can't have it superseed the "escape key" to blur that UI element
        // In this case the focus trap moves the focus out of the modal
        // correctly once it closes because of the "onBeforeUnmount" trigger
        escapeDeactivates: false,
        allowOutsideClick: true,
      });
    }
  }
});
</script>

<template>
  <div
    id="focus-trap-card-container-element"
    class="card-container"
    :class="{'highlight-border': showHighlightBorder, 'card-sticky': sticky}"
    data-testid="card"
  >
    <div class="card-wrap">
      <div
        class="card-title"
        data-testid="card-title-slot"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <hr>
      <div
        class="card-body"
        data-testid="card-body-slot"
      >
        <slot name="body">
          {{ content }}
        </slot>
      </div>
      <div
        v-if="showActions"
        class="card-actions"
        data-testid="card-actions-slot"
      >
        <slot name="actions">
          <button
            class="btn role-primary"
            @click="buttonAction"
          >
            {{ buttonText }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
 .card-container {
  &.highlight-border {
    border-left: 5px solid var(--primary);
  }
  border-radius: var(--border-radius);
  display: flex;
  flex-basis: 40%;
  margin: 10px;
  min-height: 100px;
  padding: 10px;
  box-shadow: 0 0 20px var(--shadow);
  &:not(.top) {
    align-items: top;
    flex-direction: row;
    justify-content: start;
  }
  .card-wrap {
    width: 100%;
  }
   & .card-body {
    color: var(--input-label);
    display: flex;
    flex-direction: column;
    justify-content: center;
   }
   & .card-actions {
     align-self: end;
     display: flex;
     padding-top: 20px;
   }
   & .card-title {
    align-items: center;
    display: flex;
    width: 100%;
     h5 {
       margin: 0;
     }
    .flex-right {
      margin-left: auto;
    }
   }

  // Sticky mode will stick header and footer to top and bottom with content in the middle scrolling
   &.card-sticky {
      // display: flex;
      // flex-direction: column;
      overflow: hidden;

    .card-wrap {
      display: flex;
      flex-direction: column;

      .card-body {
        justify-content: flex-start;
        overflow: auto;
      }

      > * {
        flex: 0;
      }

      .card-body {
        flex: 1;
      }
    }
   }
 }
</style>
