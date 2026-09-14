<script setup lang="ts">
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
  divided?: boolean;
}>(), { chips: () => [], divided: true });

const router = useRouter();

const activate = (event: MouseEvent) => {
  if (!props.to || (event.target as HTMLElement).closest('a, button, [data-row-action]')) {
    return;
  }

  router.push(props.to);
};
</script>

<template>
  <div
    class="auth-provider-row"
    :class="{ 'auth-provider-row--link': to, 'auth-provider-row--divided': divided }"
    @click="activate"
  >
    <AuthProviderLogo :icon="icon" />
    <div class="auth-provider-row__content">
      <div class="auth-provider-row__title-row">
        <component
          :is="to ? 'router-link' : 'span'"
          :to="to"
          class="auth-provider-row__title"
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
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;

  color: var(--body-text);
  border-radius: var(--border-radius);

  &--divided {
    border-bottom: 1px solid var(--border);
  }

  &--link {
    cursor: pointer;

    &:hover {
      background-color: var(--dropdown-hover-bg);
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

    color: var(--body-text);
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
