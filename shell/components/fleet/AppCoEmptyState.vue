<script setup lang="ts">
import { BadgeState } from '@components/BadgeState';
import { RcIcon } from '@components/RcIcon';
import { computed, type PropType } from 'vue';

interface BadgeStateProps {
  transitioning?: boolean;
  error?: boolean;
  stateBackground: string;
  stateDisplay: string;
}

const props = defineProps({
  title: {
    type:     String,
    required: true,
  },
  badgeState: {
    type:    Object as PropType<BadgeStateProps | null>,
    default: null,
  },
});

const emptyState = computed(() => !props.badgeState?.transitioning && !props.badgeState?.error);
</script>

<template>
  <div :class="[{'appco-empty-state': emptyState, 'appco-transitioning-error-state': !emptyState}]">
    <component
      :is="emptyState ? 'h1' : 'h2'"
      class="appco-empty-state-title m-0"
    >
      {{ title }}
    </component>
    <div :class="['appco-empty-state-body', { 'has-badge': badgeState, 'direction-column': badgeState?.error }]">
      <div
        v-if="badgeState"
        class="appco-badge-container"
        role="status"
        :aria-live="badgeState.transitioning ? 'polite' : undefined"
      >
        <RcIcon
          v-if="badgeState.transitioning"
          class="icon-spin"
          type="spinner"
          size="large"
          aria-hidden="true"
        />
        <RcIcon
          v-else-if="badgeState.error"
          type="alert-alt"
          status="error"
          size="large"
          aria-hidden="true"
        />
        <BadgeState
          :color="badgeState.stateBackground"
          :label="badgeState.stateDisplay"
        />
      </div>
      <p>
        <slot />
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.appco-transitioning-error-state {
  gap: var(--gap-md);
  padding: 24px 0;
}

.appco-empty-state {
  padding: 56px;
  text-align: center;
  align-items: center;

  gap: var(--gap-lg);

  .appco-empty-state-body {
    margin: 0 auto;

    &.direction-column {
      flex-direction: column;
    }

    &.has-badge {
      justify-content: center;
    }
  }

  .appco-empty-state-title {
    margin-bottom: 24px;
  }
}

.appco-empty-state, .appco-transitioning-error-state {
  display: flex;
  flex-direction: column;
  .appco-empty-state-title {
    display: inline-flex;
    align-items: center;
  }

  .appco-empty-state-body {
    &.has-badge {
      display: flex;
      gap: var(--gap-md);
      align-items: center;
    }

    p {
      font-size: 16px;
      line-height: normal;
    }
  }

  .appco-badge-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--gap-md);
  }

}
</style>
