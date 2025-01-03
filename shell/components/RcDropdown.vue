<script setup lang="ts">
import { ref, provide } from 'vue';
import RcButton from '@shell/components/RcButton.vue';

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

/**
 * ⚠️ TODO: Rename this to setFocus or focusFirstElement or
 * focusFirstDropdownItem
 * @param _e
 */
const handleKeyDown = (_e: KeyboardEvent) => {
  if (fields?.value?.firstElementChild instanceof HTMLElement) {
    fields.value.firstElementChild.focus();
  }
};

</script>

<template>
  <v-dropdown no-auto-focus>
    <slot name="default">
      <rc-button
        link
        aria-haspopup="menu"
        @keydown="handleKeyDown"
      >
        Test Menu
      </rc-button>
    </slot>

    <template
      #popper
    >
      <slot
        ref="popper"
        name="popper"
      >
        <!--Empty slot content-->
      </slot>
    </template>
  </v-dropdown>
</template>
