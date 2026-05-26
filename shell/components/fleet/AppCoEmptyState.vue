<script setup lang="ts">
import { BadgeState } from '@components/BadgeState';
import { RcIcon } from '@components/RcIcon';

defineProps({
  title: {
    type:     String,
    required: true,
  },
  badgeState: {
    type:    Object,
    default: null,
  },
});
</script>

<template>
  <div class="appco-empty-state">
    <h1 class="appco-empty-state-title">
      {{ title }}
    </h1>
    <div :class="['appco-empty-state-body', { 'has-badge': badgeState, 'direction-column': badgeState?.error }]">
      <div class="appco-badge-container">
        <RcIcon
          v-if="badgeState?.transitioning"
          class="icon-spin"
          type="spinner"
          size="large"
        />
        <BadgeState
          v-if="badgeState"
          :color="badgeState.stateBackground"
          :label="badgeState.stateDisplay"
        />
        <p
          v-if="badgeState?.error && badgeState?.errorMessage"
          class="error-message"
        >
          {{ badgeState.errorMessage }}
        </p>
      </div>
      <p>
        <slot />
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.appco-empty-state {
  text-align: center;
  padding: 56px 56px;

  .appco-empty-state-title {
    display: inline-flex;
    align-items: center;
    margin-bottom: 24px;
  }

  .appco-empty-state-body {
    &.has-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    &.direction-column {
      flex-direction: column;
    }

    p {
      font-size: 16px;
      line-height: normal;

      &.error-message {
        color: var(--error);
      }
    }
  }

  .appco-badge-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
}
</style>
