<script>
export default {
  components: { },
  props:      {
    row: {
      type:     Object,
      required: true,
    },
    options: {
      type:    [Object, String],
      default: null,
    },
  },
  data() {
    return { thumbsDown: require('~/assets/images/thumb_down.svg') };
  },
  methods: {
    remove() {
      this.row.remove();
    }
  }
};
</script>

<template>
  <span>
    <button class="btn btn-sm role-primary role-error" @click="remove">
      <img :src="thumbsDown" />
    </button>
  </span>
</template>

<style lang="scss" scoped>
.btn {
  margin-right: 15px;
  padding-top: 5px;
}

img {
  $size: 15px;
  width: $size;
  height: $size;
}
</style>
