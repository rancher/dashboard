<script setup lang="ts">
/**
 * A section container used for grouping and organizing content, with an
 * optional header that supports title, badges, actions, and expandability.
 *
 * Example:
 *
 * <rc-section title="Details" type="primary">
 *   <p>Section content here</p>
 * </rc-section>
 *
 * <rc-section title="Advanced" type="secondary" expandable v-model:expanded="isExpanded">
 *   <template #badges><RcStatusBadge status="success">Active</RcStatusBadge></template>
 *   <template #actions><RcButton variant="secondary" size="small">Edit</RcButton></template>
 *   <p>Expandable section content</p>
 * </rc-section>
 */
import { computed } from 'vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';

const props = withDefaults(defineProps<{
  type: 'primary' | 'secondary';
  mode: 'with-header' | 'no-header';
  expandable: boolean;
  expanded?: boolean;
  background: 'primary' | 'secondary';
  title?: string;
}>(), { expanded: true, title: '' });

const emit = defineEmits<{ 'update:expanded': [value: boolean] }>();

const hasHeader = computed(() => {
  return props.mode === 'with-header';
});

const sectionClass = computed(() => ({
  'rc-section':     true,
  'type-primary':   props.type === 'primary',
  'type-secondary': props.type === 'secondary',
  'bg-primary':     props.background === 'primary',
  'bg-secondary':   props.background === 'secondary',
}));

const contentClass = computed(() => ({
  'section-content':    true,
  'no-header':          !hasHeader.value,
  'expandable-content': props.expandable,
}));

function toggle() {
  if (props.expandable) {
    emit('update:expanded', !props.expanded);
  }
}
</script>

<template>
  <div :class="sectionClass">
    <div
      v-if="hasHeader"
      class="section-header"
      :class="{ expandable: props.expandable, collapsed: !props.expanded }"
      :role="props.expandable ? 'button' : undefined"
      :tabindex="props.expandable ? 0 : undefined"
      :aria-expanded="props.expandable ? props.expanded : undefined"
      @click="toggle"
      @keydown.enter="toggle"
      @keydown.space.prevent="toggle"
    >
      <div class="left-wrapper">
        <RcIcon
          v-if="props.expandable"
          class="toggle-icon"
          :type="props.expanded ? 'chevron-down' : 'chevron-right'"
          size="medium"
        />
        <div class="title">
          <slot name="title">
            {{ props.title }}
          </slot>
        </div>
        <slot name="counter" />
        <slot name="errors" />
      </div>
      <div
        v-if="$slots.badges || $slots.actions"
        class="right-wrapper"
      >
        <div
          v-if="$slots.badges"
          class="status-badges"
        >
          <slot name="badges" />
        </div>
        <div
          v-if="$slots.actions"
          class="actions"
          @click.stop
        >
          <slot name="actions" />
        </div>
      </div>
    </div>
    <div
      v-if="props.expanded"
      :class="contentClass"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rc-section {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.type-primary {
    .title {
      font-weight: 700;
    }
  }

  &.type-secondary {
    padding: 0 16px;
    border-radius: 8px;

    .title {
      font-weight: 600;
    }
  }

  &.bg-primary {
    background-color: var(--rc-section-background-primary);
  }

  &.bg-secondary {
    background-color: var(--rc-section-background-secondary);
  }
}

.section-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  height: 56px;

  &.expandable {
    cursor: pointer;
    user-select: none;

    &:focus-visible {
      @include focus-outline;
      outline-offset: 2px;
    }
  }
}

.left-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  line-height: 1.2;
  color: var(--body-text, inherit);
}

.toggle-icon {
  flex-shrink: 0;
  color: var(--body-text, inherit);
}

.right-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  margin-left: auto;
}

.status-badges {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 0 16px;

  &.no-header {
    padding: 16px 0;
  }

  &.expandable-content {
    padding: 0 0 16px 24px;
  }
}
</style>
