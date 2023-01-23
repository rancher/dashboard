<script>
export default {
  name:  'ActivityBarBody',
  props: {
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
      <nuxt-link :to="activity.route">
        <div
          class="activity-icon"
          :class="{ active: activity.active }"
        >
          <span
            class="icon icon-2x"
            :class="[activity.icon]"
          />
        </div>
        <transition name="fade">
          <span
            v-show="isExpanded"
            class="activity-text"
            :class="{ active: activity.active }"
          >
            {{ activity.label }}
          </span>
        </transition>
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
      gap: 1rem;
      align-items: center;
      cursor: pointer;

      &:active {
        text-decoration: none;
      }

      &:hover {
        text-decoration: none;

        .activity-icon {
          color: var(--primary-hover-text);
          border-color: var(--primary-hover-text);
        }

        .activity-text {
          color: var(--primary-hover-text);
        }
      }

      .activity-text {
        color: #BCBCBC;
        flex-shrink: 0;

        &.active {
          color: var(--darker-text);
        }
      }

      .activity-icon {
        &.active {
          border: 1px solid var(--activity-icon-active-background);
          background-color: var(--activity-icon-active-background);
          color: var(--activity-icon-color);
        }

        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        min-height: 36px;
        border: 1px solid #BCBCBC;
        color: #BCBCBC;
        border-radius: 8px;
        opacity: 1;
      }
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .25s;
  }

  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
</style>
