<script>
export default {
  props:      {
    vertical: {
      type:     Boolean,
      default: false,
    },
    icon: {
      type:     String,
      required: true,
    },
    iconState: {
      type:     String,
      default: null
    },
    message: {
      type:    String,
      default: null
    },
    messageKey: {
      type:    String,
      default: null
    },
    subtle: {
      type:     Boolean,
      default: false,
    }
  },
};
</script>

<template>
  <div class="message-icon" :class="{'vertical': vertical, 'subtle': subtle}">
    <i class="icon" :class="{ [icon]: true, [iconState]: !!iconState}" />
    <div class="message">
      <slot name="message">
        <template v-if="messageKey">
          {{ t(messageKey) }}
        </template>
        <template v-else>
          {{ message }}
        </template>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .vertical {
    flex-direction: column;
    width: 100%;
  }

  .subtle {
    opacity: 0.7;
  }

  .message-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    flex-direction: column;

    > I {
      font-size: 64px;
      margin-bottom: 20px;

      &.info {
      color: var(--primary);
      }

      &.error {
        color: var(--error);
      }

      &.warning {
        color: var(--warning);
      }

      &.success {
        color: var(--success);
      }
    }

    > .message {
      font-size: 20px;
      margin-bottom: 40px;
      max-width: 60%;
      text-align: center;
      line-height: 30px;
    }

  }
</style>
