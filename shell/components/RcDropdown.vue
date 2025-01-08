<script setup lang="ts">
import { ref, provide, nextTick } from 'vue';
import RcButton, { RcButton as RcButtonType } from '@shell/components/RcButton.vue';
import { useClickOutside } from '@shell/composables/useClickOutside';

const fields = ref<HTMLElement | null>(null);

/**
 * This is a method to register dropdown fields so that they can be accessed via
 * inject in child elements
 * @param field ⚠️ TODO: Rename this. This method originally registered each
 * individual field located in the list. Right now, we register the entire list.
 */
const register = (field: HTMLElement | null) => {
  fields.value = field;
};

provide('dropdownCollection', { register, fields });

const close = () => {
  returnFocus();
};

provide('dropdownContext', { close });

const popperContainer = ref<HTMLElement | null>(null);

const setFocus = () => {
  nextTick(() => {
    if (!didKeydown.value) {
      popperContainer.value?.focus();

      return;
    }

    if (fields?.value?.firstElementChild instanceof HTMLElement) {
      fields.value.firstElementChild.focus();
    }

    didKeydown.value = false;
  });
};

const didKeydown = ref(false);

const handleKeydown = () => {
  didKeydown.value = true;
};

const focusFirstElement = () => {
  handleKeydown();
  setFocus();
};

const isMenuOpen = ref(false);

const showMenu = (show: boolean) => {
  isMenuOpen.value = show;
};

const target = ref(null);

useClickOutside(target, () => showMenu(false));

const dropdownTrigger = ref<RcButtonType | null>(null);

const returnFocus = () => {
  showMenu(false);
  dropdownTrigger?.value?.focus();
};

</script>

<template>
  <v-dropdown
    no-auto-focus
    :triggers="[]"
    :shown="isMenuOpen"
    :autoHide="false"
    :container="'.popperContainer'"
    @apply-show="setFocus"
  >
    <slot name="default">
      <rc-button
        ref="dropdownTrigger"
        link
        aria-haspopup="menu"
        @keydown="handleKeydown"
        @click="showMenu(true)"
      >
        Test Menu
      </rc-button>
    </slot>

    <template #popper>
      <div ref="target">
        <!--⚠️ Rename this slot. popper is very specific to floating-vue impl-->
        <slot name="popper">
          <!--Empty slot content-->
        </slot>
      </div>
    </template>
  </v-dropdown>
  <div
    ref="popperContainer"
    class="popperContainer"
    tabindex="-1"
    @keydown.down="focusFirstElement"
    @keydown.tab="showMenu(false)"
    @keydown.escape="returnFocus"
  >
    <!--Empty container for mounting popper content-->
  </div>
</template>

<style lang="scss" scoped>
  .popperContainer :deep(.v-popper__popper) {
    .v-popper__wrapper {
      .v-popper__arrow-container {
        display: none;
      }

      .v-popper__inner {
        padding: 10px 0 10px 0;
      }
    }
  }
</style>
