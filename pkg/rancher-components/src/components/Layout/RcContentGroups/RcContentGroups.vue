<script setup lang="ts">
/**
 * A stack of content groups, spaced 24px apart. The two halves of the pair:
 * this one spaces groups 24px apart, RcContentGroup stacks the content of a
 * single group 16px apart. A stack hides itself when it has no content, so it
 * takes no space in whatever is stacking it.
 *
 * RcSection wraps its default slot in one of these, so a section's direct
 * children are its groups and no call site needs to hand-roll the 24px column.
 * Put an RcContentGroup inside when a run of content belongs together at 16px.
 * Neither component is tied to RcSection, so this can also be used on its own
 * wherever a 24px column is wanted.
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
  <div class="rc-content-groups">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.rc-content-groups {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg, 24px);

  // A stack whose content is entirely conditioned out would otherwise still
  // take a slot in the gap of whatever is stacking it. `:empty` ignores comment
  // nodes and zero-length text, and Vue drops whitespace-only text at the edges
  // of an element and anywhere it spans a newline, so `v-if` and `v-for`
  // placeholders collapse the stack.
  //
  // Not covered: `v-show`, whose hidden child is still a child, and two or more
  // conditioned-out siblings written on one line, where Vue condenses the gap
  // between them into a single space that `:empty` counts as content.
  &:empty {
    display: none;
  }
}
</style>
