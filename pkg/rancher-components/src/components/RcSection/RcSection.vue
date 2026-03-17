<script setup lang="ts">
/**
 * A section container used for grouping and organizing content, with an
 * optional header that supports title, badges, actions, and expandability.
 *
 * Example:
 *
 * <RcSection title="Section title" type="secondary" mode="with-header" :expandable="false" background="secondary">
 *   <p>Section content here</p>
 * </RcSection>
 *
 * <RcSection title="Section title" type="secondary" mode="with-header" expandable v-model:expanded="expanded" background="secondary">
 *   <template #counter>
 *     <RcCounterBadge :count="99" type="inactive" />
 *   </template>
 *   <template #errors>
 *     <RcIcon v-clean-tooltip="'3 validation errors'" type="error" size="large" status="error" />
 *   </template>
 *   <template #badges>
 *     <RcSectionBadges :badges="[
 *       { label: 'Status', status: 'success', tooltip: 'All systems operational' },
 *       { label: 'Status', status: 'warning', tooltip: 'Degraded performance' },
 *       { label: 'Status', status: 'error', tooltip: 'Service unavailable' },
 *     ]" />
 *   </template>
 *   <template #actions>
 *     <RcSectionActions :actions="[
 *       { label: 'Action', icon: 'chevron-left', action: () => {} },
 *       { icon: 'copy', ariaLabel: 'Copy', action: () => {} },
 *       { icon: 'trash', label: 'Delete', action: () => {} },
 *     ]" />
 *   </template>
 *   <p>Section content here</p>
 * </RcSection>
 */
import { computed, inject, provide, type Ref } from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import type { RcSectionProps, SectionBackground } from './types';

const RC_SECTION_BG_KEY = 'rc-section-background';

const props = withDefaults(defineProps<RcSectionProps>(), { title: '' });

const parentBackground = inject<Ref<SectionBackground> | null>(RC_SECTION_BG_KEY, null);

const resolvedBackground = computed<SectionBackground>(() => {
  if (props.background) {
    return props.background;
  }

  const parent = parentBackground?.value ?? null;

  return parent === 'primary' ? 'secondary' : 'primary';
});

provide(RC_SECTION_BG_KEY, resolvedBackground);

const expanded = defineModel<boolean>('expanded', { default: true });

const hasHeader = computed(() => {
  return props.mode === 'with-header';
});

const sectionClass = computed(() => ({
  'rc-section':     true,
  'type-primary':   props.type === 'primary',
  'type-secondary': props.type === 'secondary',
  'bg-primary':     resolvedBackground.value === 'primary',
  'bg-secondary':   resolvedBackground.value === 'secondary',
}));

const contentClass = computed(() => ({
  'section-content':    true,
  'no-header':          !hasHeader.value,
  'expandable-content': props.expandable,
}));

function toggle() {
  if (props.expandable) {
    expanded.value = !expanded.value;
  }
}
</script>

<template>
  <div :class="sectionClass">
    <div
      v-if="hasHeader"
      class="section-header"
      :class="{ expandable: props.expandable, collapsed: !expanded }"
      @click="toggle"
    >
      <div class="left-wrapper">
        <RcButton
          v-if="props.expandable"
          class="toggle-button"
          variant="ghost"
          :aria-expanded="expanded"
          :aria-label="expanded ? 'Collapse section' : 'Expand section'"
          @click.stop="toggle"
        >
          <RcIcon
            :type="expanded ? 'chevron-down' : 'chevron-right'"
            size="medium"
          />
        </RcButton>
        <div class="title">
          <slot name="title">
            {{ props.title }}
          </slot>
          <slot name="counter" />
          <slot name="errors" />
        </div>
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
      v-if="expanded"
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
  }
}

.left-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  .toggle-button + .title {
    margin-left: -4px;
  }
}

.title {
  display: inline-flex;
  gap: 12px;
  font-size: 18px;
  line-height: 1.2;
  color: var(--body-text, inherit);
}

button.btn-medium.toggle-button {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--body-text, inherit);
  padding: 0;
  min-height: initial;
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
  gap: 0;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 0 16px;
  color: var(--body-text);

  &.expandable-content {
    padding: 0 0 16px 24px;
  }

  &.no-header {
    padding: 16px 0;
  }
}
</style>
