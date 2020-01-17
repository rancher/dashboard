<script>
export default {
  props: {
    text: {
      type:     String,
      required: true,
    },
  },

  methods: {
    clicked(event) {
      event.preventDefault();
      this.$copyText(this.text);
    },
  }
};
</script>

<template>
  <a href="#" @click="clicked">
    {{ text }} <i class="icon icon-copy" />
  </a>
</template>
