<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';
import { RcStatusBadge, RcTag } from '@components/Pill';
import type { Status } from '@components/utils/status';
import AuthProviderLogo from '@shell/components/auth/AuthProviderLogo.vue';

const props = withDefaults(defineProps<{
  title: string;
  icon?: string;
  chips?: string[];
  description?: string;
  meta?: string;
  status?: Status;
  statusLabel?: string;
  to?: RouteLocationRaw;
  selectable?: boolean;
  divided?: boolean;
  disabled?: boolean;
}>(), { chips: () => [], divided: true });

const emit = defineEmits(['select']);

const router = useRouter();

const interactive = computed(() => !!props.to || props.selectable);

const activate = (event: MouseEvent) => {
  if (!interactive.value || (event.target as HTMLElement).closest('a, button, [data-row-action]')) {
    return;
  }

  if (props.to) {
    router.push(props.to);
  } else {
    emit('select');
  }
};

const isTitleButton = computed(() => !props.to && props.selectable);

const titleTag = computed(() => {
  if (props.to) {
    return 'router-link';
  }

  return isTitleButton.value ? 'button' : 'span';
});

const activateFromTitle = () => {
  if (isTitleButton.value) {
    emit('select');
  }
};
</script>

<template>
  <div
    class="auth-provider-row"
    :class="{
      'auth-provider-row--link': interactive,
      'auth-provider-row--divided': divided,
      'auth-provider-row--disabled': disabled,
    }"
    @click="activate"
  >
    <AuthProviderLogo :icon="icon" />
    <div class="auth-provider-row__content">
      <div class="auth-provider-row__title-row">
        <component
          :is="titleTag"
          :to="to"
          :type="isTitleButton ? 'button' : undefined"
          class="auth-provider-row__title"
          @click="activateFromTitle"
        >
          {{ title }}
        </component>
        <RcTag
          v-for="chip in chips"
          :key="chip"
          type="inactive"
          class="auth-provider-row__chip"
        >
          {{ chip }}
        </RcTag>
      </div>
      <span
        v-if="description"
        class="auth-provider-row__description"
      >
        {{ description }}
      </span>
      <div
        v-if="meta || $slots['meta-trailing']"
        class="auth-provider-row__meta-row"
      >
        <RcTag
          v-if="meta"
          type="inactive"
          class="auth-provider-row__meta"
        >
          {{ meta }}
        </RcTag>
        <div
          v-if="$slots['meta-trailing']"
          class="auth-provider-row__slot"
          data-row-action
        >
          <slot name="meta-trailing" />
        </div>
      </div>
    </div>
    <div class="auth-provider-row__trailing">
      <RcStatusBadge
        v-if="statusLabel"
        :status="status || 'none'"
      >
        {{ statusLabel }}
      </RcStatusBadge>
      <div
        v-if="$slots.trailing"
        class="auth-provider-row__slot"
        data-row-action
      >
        <slot name="trailing" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$header-line: 32px;

.auth-provider-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;

  color: var(--body-text);
  border-radius: var(--border-radius);

  // The rule parts one row from the next, so it runs straight across rather than
  // following the row's own rounded corners
  &--divided::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;

    border-bottom: 1px solid var(--border);
  }

  &--link {
    cursor: pointer;

    &:hover {
      background-color: var(--dropdown-hover-bg);
    }
  }

  // A provider nobody can log in with is not an ordinary row, so it carries the
  // same tint as the banner that explains why
  &--disabled {
    background-color: var(--error-banner-bg);
    border-left: 4px solid var(--error);

    &.auth-provider-row--link:hover {
      background-color: var(--error-banner-bg);
    }
  }

  // The title is the row's only tab stop, so the ring belongs to the whole row
  &:has(.auth-provider-row__title:focus-visible) {
    @include focus-outline;
    outline-offset: -2px;
  }

  // Keeps slot contents on the row's flex line instead of boxing them up
  &__slot {
    display: contents;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: $header-line;
  }

  &__title {
    flex: 1;
    min-width: 0;
    padding: 0;
    background: none;
    border: none;
    text-align: left;
    cursor: inherit;

    color: var(--body-text);
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    overflow-wrap: anywhere;

    // The whole row highlights on hover, so the title does not underline as well
    &:is(a):hover {
      color: var(--body-text);
      text-decoration: none;
    }

    &:focus-visible {
      outline: none;
    }
  }

  &__chip {
    flex-shrink: 0;
  }

  &__description {
    max-width: 100%;
    color: var(--label-secondary);
    font-size: 12px;
    line-height: 18px;
    overflow-wrap: anywhere;
  }

  &__meta-row {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
  }

  &__meta {
    max-width: 100%;
  }

  &__trailing {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    min-height: $header-line;
  }
}
</style>
