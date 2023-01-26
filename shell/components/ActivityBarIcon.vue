<script>
export default {
  name:  'ActivityBarIcon',
  props: {
    icon: {
      type:     String,
      required: true,
    },
    label: {
      type:     String,
      required: true,
    },
    isExpanded: {
      type:    Boolean,
      default: false,
    },
    isActive: {
      type:    Boolean,
      default: false,
    }
  }
};
</script>

<template>
  <div
    class="activity-container"
    :class="{ active: isActive }"
  >
    <div class="activity-icon">
      <span
        class="icon icon-2x"
        :class="[icon]"
      />
    </div>
    <transition name="fade">
      <span
        v-show="isExpanded"
        class="activity-text"
      >
        {{ label }}
      </span>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
  .activity-container {
    display: flex;
    align-items: center;
    gap: 1rem;

    &.active {
      .activity-icon {
        border: none;
        color: var(--activity-icon-color);
      }
      .activity-text {
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

  .activity-text {
    color: #BCBCBC;
    flex-shrink: 0;

    &.active {
      color: var(--darker-text);
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .25s;
  }

  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
</style>
