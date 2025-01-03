<script setup lang="ts">
import { ref, inject, onMounted, Ref } from 'vue';

/**
 * ⚠️ TODO: Move types into a separate file and import into components where
 * they are needed.
 */
type DropdownCollection = {
  register: (field: HTMLElement | null) => void;
  fields: Ref<HTMLElement | null>;
};

/**
 * ⚠️ TODO: Move the default collection into a separate file.
 */
const defaultCollection: DropdownCollection = {
  register: (_field: HTMLElement | null) => null,
  fields:   ref(null),
};

const collectionItems = ref(null);

const { register } = inject<DropdownCollection>('dropdownCollection') || defaultCollection;

onMounted(() => {
  register(collectionItems.value);
});

// ⚠️ TODO: Review the usage of this defineExpose. I do not think that it is
// needed.
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
