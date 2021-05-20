<script>
export default {
  props:      {
    icon: {
      type:     String,
      required: true,
    },
    message: {
      type:    String,
      default: null
    },
    messageKey: {
      type:    String,
      default: null
    },
  },
};
</script>

<template>
  <div class="icon-message">
    <i class="icon" :class="icon" />
    <div class="message">
      <template v-if="messageKey">
        {{ t(messageKey) }}
      </template>
      <template v-else>
        {{ message }}
      </template>
    </div>
  </div>
</template>

<style lang="scss">
  .icon-message {
    display: flex;
    align-items: center;
    justify-content: center;

    > I {
      font-size: 64px;
      margin-bottom: 20px;
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
