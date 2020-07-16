<script>
import { createPopper } from '@popperjs/core';

export default {
  props:      {
    selectProps: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  methods: {
    withPopper(dropdownList, component) {
      /**
         * We need to explicitly define the dropdown width since
         * it is usually inherited from the parent with CSS.
         */
      dropdownList.style.width = `${ this.$refs.buttonContainer.clientWidth }px`;

      /**
         * Here we position the dropdownList relative to the button/select container div element.
         *
         * The 'toggleClass' modifier adds a 'drop-up' class to the Vue Select
         * wrapper so that we can set some styles for when the dropdown is placed
         * above.
         */
      const popper = createPopper(this.$refs.buttonContainer, dropdownList, {
        placement: 'bottom',
        modifiers: [
          {
            name:    'toggleClass',
            enabled: true,
            phase:   'write',
            fn({ state }) {
              component.$el.classList.toggle('drop-up', state.placement === 'top');
            },
          }]
      });

      /**
       * To prevent memory leaks Popper needs to be destroyed.
       * If you return function, it will be called just before dropdown is removed from DOM.
       */
      return () => popper.destroy();
    }
  }
};
</script>

<template>
  <div ref="buttonContainer" class="button-container">
    <button class="btn btn-select" type="button" @click.stop="$emit('click')">
      <slot />
    </button>
    <div class="vertical-divider" />
    <v-select
      :calculate-position="withPopper"
      :append-to-body="true"
      :multiple="false"
      :value="' '"
      class="in-button"
      v-bind="$attrs"
      @input="e=>$emit('input', e)"
    />
  </div>
</template>

<style lang='scss'>

.button-container{
  background-color: var(--accent-btn);
  display: inline-flex;
  border: 1px solid var(--primary);

  & .vertical-divider {
    border-left: 1px solid var(--primary);
    padding-right: 10px;
    margin: 10px 0px 10px 0px;
  }
}
  BUTTON.btn-select {
    background: none;
    position: relative;
    color: var(--primary);
    padding: 15px 40px 15px 40px;
    border: none;
  }

   .v-select.in-button {
      & .vs__search, .vs__selected-options{
        width: 1px;
        height: 1px;
        opacity: 0;
        padding: 0px;
      }
      & .vs__clear{
        display: none;
      }
      & .vs__dropdown-toggle{
        background: none;
        border: none;
        padding-top: 17px;
      }

      & .vs__open-indicator{
        fill: var(--primary);
      }
    }

.vs__dropdown-menu {
    min-width: 0px;
  }
</style>
