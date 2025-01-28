<script setup lang="ts">
import { ref } from 'vue';
import { useClickOutside } from '@shell/composables/useClickOutside';
import { useDropdownContext } from '@components/RcDropdown/useDropdownContext';
import { useDropdownCollection } from '@components/RcDropdown/useDropdownCollection';

defineProps<{
  ariaLabel?: string
}>();

const {
  firstDropdownItem,
  provideDropdownCollection,
  registerDropdownCollection
} = useDropdownCollection();

provideDropdownCollection();

const {
  isMenuOpen,
  showMenu,
  returnFocus,
  setFocus,
  provideDropdownContext,
} = useDropdownContext(firstDropdownItem);

provideDropdownContext();

const popperContainer = ref(null);
const dropdownTarget = ref(null);

useClickOutside(dropdownTarget, () => showMenu(false));

const applyShow = () => {
  registerDropdownCollection(dropdownTarget.value);
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
    :placement="'bottom-end'"
    :distance="16"
    @apply-show="applyShow"
  >
    <slot name="default">
      <!--Empty slot content Trigger-->
    </slot>

    <template #popper>
      <div
        ref="dropdownTarget"
        role="menu"
        aria-orientation="vertical"
        dropdown-menu-collection
        :aria-label="ariaLabel || 'Dropdown Menu'"
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
