<script setup lang="ts">
import { ref, inject, onMounted, Ref } from 'vue';

type DropdownCollection = {
  register: (field: HTMLElement | null) => void;
  fields: Ref<HTMLElement | null>;
};

const defaultCollection: DropdownCollection = {
  register: (_field: HTMLElement | null) => null,
  fields:   ref(null),
};

const collectionItems = ref(null);

const { register } = inject<DropdownCollection>('dropdownCollection') || defaultCollection;

onMounted(() => {
  register(collectionItems.value);
});

defineExpose({ collectionItems });

</script>

<template>
  <div
    ref="collectionItems"
    role="menu"
  >
    <slot
      name="default"
    >
      <!--Empty slot content-->
    </slot>
  </div>
</template>
