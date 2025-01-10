<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { RcButton, RcButtonType } from '@components/RcButton';

type DropdownContext = {
  handleKeydown: () => void;
  showMenu: (show: boolean) => void;
  setTrigger: (triggerRef: RcButtonType | null) => void;
  focusFirstElement: () => void;
}

const defaultContext: DropdownContext = {
  handleKeydown:     () => null,
  showMenu:          (_show: boolean | null) => null,
  setTrigger:        (_triggerRef: RcButtonType | null) => null,
  focusFirstElement: () => null,
};

const {
  handleKeydown,
  showMenu,
  setTrigger,
  focusFirstElement,
} = inject<DropdownContext>('dropdownContext') || defaultContext;

const dropdownTrigger = ref<RcButtonType | null>(null);

onMounted(() => {
  setTrigger(dropdownTrigger.value);
});

const focus = () => {
  dropdownTrigger?.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <RcButton
    ref="dropdownTrigger"
    aria-haspopup="menu"
    @keydown="handleKeydown"
    @keydown.down="focusFirstElement"
    @click="showMenu(true)"
  >
    <slot name="default">
      <!--Empty slot content-->
    </slot>
  </RcButton>
</template>
