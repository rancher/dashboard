<script>
import ActivityBarIcon from './ActivityBarIcon';

export default {
  name:       'ActivityBarBody',
  components: { ActivityBarIcon },
  props:      {
    activities: {
      type:     Array,
      required: true,
    },
    isExpanded: {
      type:    Boolean,
      default: false,
    }
  }
};
</script>

<template>
  <div class="body">
    <div
      v-for="activity in activities"
      :key="activity.id"
      class="activity"
    >
      <nuxt-link
        :to="activity.route"
        :class="{ active: activity.active }"
      >
        <activity-bar-icon
          :icon="activity.icon"
          :label="activity.label"
          :is-expanded="isExpanded"
          :is-active="activity.active"
        />
      </nuxt-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .body {
    display: flex;
    gap: 1rem;
    flex-direction: column;

    .activity a {
      display: flex;
      align-items: center;
      cursor: pointer;

      &.active {
        border: 1px solid var(--activity-icon-active-background);
        background-color: var(--activity-icon-active-background);
        color: var(--activity-icon-color);
        border-radius: 8px;
      }

      &:hover {
        text-decoration: none;
      }

      &:active {
        text-decoration: none;
      }
    }
  }
</style>
