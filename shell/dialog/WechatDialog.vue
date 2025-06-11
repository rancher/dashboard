<script>
// i18n-ignore footer.wechat.modalText, footer.wechat.modalText2
export default {
  emits: ['close'],

  name: 'WechatModal',

  methods: {
    close() {
      this.$emit('close');
    }
  },
};
</script>

<template>
  <div class="wechat-modal">
    <h1>{{ t('footer.wechat.modalText') }}</h1>
    <h1>{{ t('footer.wechat.modalText2') }}</h1>
    <div class="qr-img" />
    <div>
      <button
        class="btn role-primary"
        tabindex="0"
        :aria-label="t('generic.close')"
        role="button"
        @click="close"
        @keydown.enter.stop
      >
        {{ t('generic.close') }}
      </button>
    </div>
  </div>
</template>

<style lang='scss' scoped>
  .wechat-modal {
    margin: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .btn {
    margin: 20px auto 0;
  }

  .qr-img {
    background-image: url('../assets/images/wechat-qr-code.jpg');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    height: 128px;
    width: 128px;
    margin: 15px auto 10px;
  }
</style>
