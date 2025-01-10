<script setup lang="ts">
import { ref, provide, nextTick } from 'vue';
import { RcButtonType } from '@components/RcButton';
import { useClickOutside } from '@shell/composables/useClickOutside';

const fields = ref<HTMLElement | null>(null);
const dropdownItems = ref<Element[]>([]);
const firstDropdownItem = ref<HTMLElement | null>(null);

/**
 * This is a method to register dropdown fields so that they can be accessed via
 * inject in child elements
 * @param field ⚠️ TODO: Rename this. This method originally registered each
 * individual field located in the list. Right now, we register the entire list.
 */
const register = (field: HTMLElement | null) => {
  fields.value = field;
  if (fields.value?.firstElementChild instanceof HTMLElement) {
    firstDropdownItem.value = fields.value.firstElementChild;
    registerDropdownItems();
  }
};

const registerDropdownItems = () => {
  dropdownItems.value = [];
  const dropdownNodeList = fields.value?.querySelectorAll('[dropdown-menu-item]');

  dropdownNodeList?.forEach((element) => {
    dropdownItems.value.push(element);
  });
};

provide('dropdownCollection', { fields, dropdownItems });

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
    :container="'.popperContainer'"
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
        <!--⚠️ Rename this slot. popper is very specific to floating-vue impl-->
        <slot name="popper">
          <!--Empty slot content-->
        </slot>
      </div>
    </template>
  </v-dropdown>
  <div
    class="popperContainer"
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
