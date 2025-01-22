<script setup lang="ts">
import { ref, provide, nextTick } from 'vue';
import { RcButtonType } from '@components/RcButton';
import { useClickOutside } from '@shell/composables/useClickOutside';

const dropdownContainer = ref<HTMLElement | null>(null);
const dropdownItems = ref<Element[]>([]);
const firstDropdownItem = ref<HTMLElement | null>(null);

const register = (target: HTMLElement | null) => {
  dropdownContainer.value = target;
  if (dropdownContainer.value?.firstElementChild instanceof HTMLElement) {
    registerDropdownItems();
    if (dropdownItems.value[0] instanceof HTMLElement) {
      firstDropdownItem.value = dropdownItems.value[0];
    }
  }
};

const registerDropdownItems = () => {
  dropdownItems.value = [];
  const dropdownNodeList = dropdownContainer.value?.querySelectorAll('[dropdown-menu-item]');

  dropdownNodeList?.forEach((element) => {
    dropdownItems.value.push(element);
  });
};

provide('dropdownCollection', { dropdownItems });

const close = () => {
  returnFocus();
};

const didKeydown = ref(false);

const handleKeydown = () => {
  didKeydown.value = true;
};

const isMenuOpen = ref(false);

const showMenu = (show: boolean) => {
  isMenuOpen.value = show;
};

const registerTrigger = (triggerRef: RcButtonType) => {
  dropdownTrigger.value = triggerRef;
};

const focusFirstElement = () => {
  handleKeydown();
  setFocus();
};

provide('dropdownContext', {
  close,
  handleKeydown,
  showMenu,
  registerTrigger,
  focusFirstElement,
  isMenuOpen,
});

const setFocus = () => {
  nextTick(() => {
    if (!didKeydown.value) {
      return;
    }

    firstDropdownItem.value?.focus();

    didKeydown.value = false;
  });
};

const popperContainer = ref(null);
const dropdownTarget = ref(null);

useClickOutside(dropdownTarget, () => showMenu(false));

const dropdownTrigger = ref<RcButtonType | null>(null);

const returnFocus = () => {
  showMenu(false);
  dropdownTrigger?.value?.focus();
};

const applyShow = () => {
  register(dropdownTarget.value);
  setFocus();
};

</script>

<template>
  <v-dropdown
    no-auto-focus
    :triggers="[]"
    :shown="isMenuOpen"
    :auto-hide="false"
    :container="popperContainer"
    @apply-show="applyShow"
  >
    <slot name="default">
      <!--Empty slot content Trigger-->
    </slot>

    <template #popper>
      <div
        ref="dropdownTarget"
        role="menu"
        aria-label="Dropdown Collection"
      >
        <slot name="dropdownCollection">
          <!--Empty slot content-->
        </slot>
      </div>
    </template>
  </v-dropdown>
  <div
    ref="popperContainer"
    class="popperContainer"
    @keydown.tab="showMenu(false)"
    @keydown.escape="returnFocus"
  >
    <!--Empty container for mounting popper content-->
  </div>
</template>

<style lang="scss" scoped>
  .popperContainer {
    display: contents;
    &:deep(.v-popper__popper) {
      .v-popper__wrapper {
        .v-popper__arrow-container {
          display: none;
        }

        .v-popper__inner {
          padding: 10px 0 10px 0;
        }
      }
    }
  }
</style>
