<script setup lang="ts">
/**
 * A group of related content within a RcSection.
 *
 * RcSection spaces its direct children 24px apart. This component stacks the
 * content it is given 16px apart, so a section can hold several groups of form
 * elements without every call site hand-rolling its own wrapper div. Use as
 * many groups in one section as the content needs.
 *
 * Example:
 *
 * <RcSection title="Section title" mode="with-header">
 *   <RcSectionContentGroup>
 *     <LabeledInput label="Name" />
 *     <LabeledInput label="Description" />
 *   </RcSectionContentGroup>
 *   <RcSectionContentGroup>
 *     <LabeledInput label="Namespace" />
 *   </RcSectionContentGroup>
 * </RcSection>
 */
</script>

<template>
  <div
    class="rc-section-content-group"
    data-testid="rc-section-content-group"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.rc-section-content-group {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md, 16px);

  // A group whose content is entirely conditioned out would otherwise still
  // take a slot in the section's 24px gap. `:empty` ignores comment nodes and
  // zero-length text, and Vue drops whitespace-only text at the edges of an
  // element and anywhere it spans a newline, so `v-if` and `v-for` placeholders
  // collapse the group.
  //
  // Not covered: `v-show`, whose hidden child is still a child, and two or more
  // conditioned-out siblings written on one line, where Vue condenses the gap
  // between them into a single space that `:empty` counts as content.
  &:empty {
    display: none;
  }
}
</style>
