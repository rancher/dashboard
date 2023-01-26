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
      <nuxt-link
        :to="activity.route"
        :class="{ active: activity.active }"
      >
        <div class="activity-icon">
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

      &.active {
        border: 1px solid var(--activity-icon-active-background);
        background-color: var(--activity-icon-active-background);
        color: var(--activity-icon-color);
        border-radius: 8px;

        .activity-icon {
          border: none;
          color: var(--activity-icon-color);
        }
      }

      &:not(.active) {
        &:hover {
          .activity-icon {
            color: var(--primary-hover-text);
            border-color: var(--primary-hover-text);
          }

          .activity-text {
            color: var(--primary-hover-text);
          }
        }
      }

      &:hover {
        text-decoration: none;
      }

      &:active {
        text-decoration: none;
      }

      .activity-text {
        color: #BCBCBC;
        flex-shrink: 0;

        &.active {
          color: var(--darker-text);
        }
      }

      .activity-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 34px;
        min-height: 34px;
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
