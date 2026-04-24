<script>
export default {
  name:   'EmptyProductPage',
  layout: 'plain',
  data() {
    const err = this.$route.meta?.pageError;

    let msg;

    switch (err) {
    case 'no-nav':
      msg = [
        'When a component is not provided for a product, the layout with side navigation is used',
        'No child items were specified, so this "Default" empty view has been added',
        'Please add child items to this product'
      ];
      break;
    default:
      msg = ['No component defined for this extension product... Define a component or child pages so it can be rendered here.'];
    }

    return {
      img: require('~shell/assets/images/generic-plugin.svg'),
      msg,
    };
  },
};
</script>

<template>
  <div class="empty-product-page">
    <img
      :src="img"
      alt="Extension Product Error"
    >
    <div class="err-messages">
      <p
        v-for="(m, index) in msg"
        :key="index"
      >
        {{ m }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.empty-product-page {
  align-items: center;
  display: flex;
  justify-content: center;
  opacity: 0.75;

  > img {
    width: 128px;
    margin-bottom: 20px;
  }

  .err-messages {
    display: flex;
    align-items: center;
    text-align: center;
    flex-direction: column;

    > * {
      margin-bottom: 8px;
      font-size: 16px;

      &:last-child {
        font-weight: bold;
        color: var(--error);
      }
    }
  }
}
</style>
