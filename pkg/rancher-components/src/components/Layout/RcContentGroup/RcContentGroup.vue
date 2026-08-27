<script setup lang="ts">
/**
 * A group of related content, stacked 16px apart.
 *
 * RcSection wraps its default slot in one of these, so form elements written
 * straight into a section are already grouped at 16px and no call site needs a
 * wrapper div of its own. A section that needs several groups replaces that
 * wrapper through the section's `groups` slot, and the section spaces the
 * groups it is given 24px apart.
 *
 * The component is not tied to RcSection, so it can also be used on its own
 * wherever a 16px column is wanted.
 *
 * Example:
 *
 * <RcSection title="Section title" mode="with-header">
 *   <template #groups>
 *     <RcContentGroup>
 *       <LabeledInput label="Name" />
 *       <LabeledInput label="Description" />
 *     </RcContentGroup>
 *     <RcContentGroup>
 *       <LabeledInput label="Namespace" />
 *     </RcContentGroup>
 *   </template>
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
