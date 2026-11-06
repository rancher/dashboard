<script setup lang="ts">
/**
 * Renderless component that supplies a mode and disabled state to every Rancher
 * Components field inside it.
 *
 * Example:
 *
 * <rc-field-group :mode="isView ? _VIEW : _EDIT" :disabled="isSaving">
 *   <rc-input v-model="name" label="Name" />
 *   <rc-input-password v-model="token" label="Token" />
 *   <rc-input v-model="id" label="ID" disabled />
 * </rc-field-group>
 */
import { provideFieldState } from './useFieldState';
import type { RcFieldStateProps } from './types';

const props = withDefaults(defineProps<RcFieldStateProps>(), {
  mode:     undefined,
  disabled: undefined,
});

provideFieldState({
  mode:     () => props.mode,
  disabled: () => props.disabled,
});
</script>

<template>
  <slot />
</template>
