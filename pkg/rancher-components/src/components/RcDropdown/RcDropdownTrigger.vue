<script setup lang="ts">
import { inject, onMounted, ref, Ref } from 'vue';
import { RcButton, RcButtonType } from '@components/RcButton';

type DropdownContext = {
  handleKeydown: () => void;
  showMenu: (show: boolean) => void;
  registerTrigger: (triggerRef: RcButtonType | null) => void;
  focusFirstElement: () => void;
  isMenuOpen: Ref<boolean>;
}

const defaultContext: DropdownContext = {
  handleKeydown:     () => null,
  showMenu:          (_show: boolean | null) => null,
  registerTrigger:   (_triggerRef: RcButtonType | null) => null,
  focusFirstElement: () => null,
  isMenuOpen:        ref(false),
};

const {
  handleKeydown,
  showMenu,
  registerTrigger,
  focusFirstElement,
  isMenuOpen,
} = inject<DropdownContext>('dropdownContext') || defaultContext;

const dropdownTrigger = ref<RcButtonType | null>(null);

onMounted(() => {
  registerTrigger(dropdownTrigger.value);
});

const focus = () => {
  dropdownTrigger?.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <RcButton
    ref="dropdownTrigger"
    role="button"
    aria-haspopup="menu"
    :aria-expanded="isMenuOpen"
    @keydown="handleKeydown"
    @keydown.down="focusFirstElement"
    @keydown.escape="showMenu(false)"
    @click="showMenu(true)"
  >
    <slot name="default">
      <!--Empty slot content-->
    </slot>
  </RcButton>
</template>
