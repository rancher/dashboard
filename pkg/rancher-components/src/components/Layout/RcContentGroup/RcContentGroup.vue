<script setup lang="ts">
/**
 * A group of related content, stacked 16px apart. A group hides itself when it
 * has no content, so it takes no space in whatever is stacking it.
 *
 * The other half of the pair is RcContentGroups, which spaces groups 24px
 * apart. RcSection wraps its default slot in one of those, so a section's
 * direct children are already its groups: reach for RcContentGroup when a run
 * of that content belongs together at 16px. The component is not tied to
 * RcSection, so it can also be used on its own wherever a 16px column is
 * wanted.
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

  // A group whose content is entirely conditioned out would otherwise still
  // take a slot in the gap of whatever is stacking it. `:empty` ignores comment
  // nodes and zero-length text, and Vue drops whitespace-only text at the edges
  // of an element and anywhere it spans a newline, so `v-if` and `v-for`
  // placeholders collapse the group.
  //
  // Not covered: `v-show`, whose hidden child is still a child, and two or more
  // conditioned-out siblings written on one line, where Vue condenses the gap
  // between them into a single space that `:empty` counts as content.
  &:empty {
    display: none;
  }
}
</style>
