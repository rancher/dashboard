<script>
export default {
  props: {
    value: {
      type:     Array,
      default: () => {
        return [];
      }
    }
  },
  computed: {
    images() {
      return this.value.map(container => container.image)
        .filter(image => !image.startsWith('sha256'));
    }
  }

};
</script>

<template>
  <span>
    <span>{{ images[0] }}</span><br>
    <span v-if="images.length-1>0" class="plus-more">+{{ images.length-1 }} more</span>
  </span>
</template>
