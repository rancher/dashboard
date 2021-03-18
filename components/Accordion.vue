<script>
export default {
  props:      {
    expandedInitially: {
      type:     Boolean,
      default: false
    },
    title: {
      type:     String,
      default: null
    },
  },

  data() {
    return {
      expanded:     this.expandedInitially,
      expandedOnce: this.expandedInitially
    };
  },

  methods: {
    toggle(ev) {
      ev.preventDefault();
      this.$set(this, 'expanded', !this.expanded);
      this.$set(this, 'expandedOnce', !this.expanded || this.expandedOnce);
    }
  }
};
</script>

<template>
  <div class="accordion">
    <div class="heading" @click="toggle">
      <h3>{{ title }}</h3>
      <a v-if="expanded" href="#">COLLAPSE</a>
      <a v-else href="#">EXPAND</a>
    </div>
    <hr class="divider" />
    <div v-if="expanded || expandedOnce" v-show="expanded" class="content">
      <slot />
    </div>
  </div>
</template>

<style lang='scss' scoped>
.heading {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
}
</style>
