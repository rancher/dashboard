<script setup lang="ts">
import { ref, provide } from 'vue';
import RcButton from '@shell/components/RcButton.vue';

const fields = ref<HTMLElement | null>(null);

const register = (field: HTMLElement | null) => {
  fields.value = field;
};

provide('dropdownCollection', { register, fields });

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
