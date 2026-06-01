<script setup lang="ts">
import { BadgeState } from '@components/BadgeState';
import { RcIcon } from '@components/RcIcon';
import { computed } from 'vue';

const props = defineProps({
  title: {
    type:     String,
    required: true,
  },
  badgeState: {
    type:    Object,
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
      <div class="appco-badge-container">
        <RcIcon
          v-if="badgeState?.transitioning"
          class="icon-spin"
          type="spinner"
          size="large"
        />
        <RcIcon
          v-else-if="badgeState?.error"
          type="alert-alt"
          status="error"
          size="large"
        />
        <BadgeState
          v-if="badgeState"
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
  padding: 0px;
  gap: var(--gap-md);
  padding: 24px 0;
}

.appco-empty-state {
  padding: 56px 56px;
  text-align: center;
  align-items: center;

  gap: var(--gap-lg);

  .appco-empty-state-body {
    max-width: 400px;
    margin: 0 auto;

    &.direction-column {
      flex-direction: column;
    }
  }

  .appco-transitioning-error-state {
    .appco-empty-state-body {
      max-width: none;
      margin: 0;
    }
  }
  .appco-empty-state-title {
    margin-bottom: 24px;
  }
  .appco-empty-state-body {
    &.has-badge {
      justify-content: center;
    }
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
