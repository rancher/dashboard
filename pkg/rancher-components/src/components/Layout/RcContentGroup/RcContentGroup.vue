<script setup lang="ts">
/**
 * A group of related content, stacked 16px apart.
 *
 * RcSection already stacks its default slot 16px apart, so form elements
 * written straight into a section need no wrapper of their own. A section that
 * needs several groups writes an RcContentGroup per group instead, and the
 * section spaces those groups 24px apart.
 *
 * The component is not tied to RcSection, so it can also be used on its own
 * wherever a 16px column is wanted.
 *
 * Example:
 *
 * <RcSection title="Section title" mode="with-header">
 *   <RcContentGroup>
 *     <LabeledInput label="Name" />
 *     <LabeledInput label="Description" />
 *   </RcContentGroup>
 *   <RcContentGroup>
 *     <LabeledInput label="Namespace" />
 *   </RcContentGroup>
 * </RcSection>
 */
</script>

<template>
  <div class="rc-content-group">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.rc-content-group {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md, 16px);
}
</style>
