<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  props: {
    title: {
      type:     String,
      required: true
    },

    openInitially: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { isOpen: this.openInitially };
  },

  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    }
  }
});
</script>

<template>
  <div class="accordion-container">
    <div
      class="accordion-header"
      @click="toggle"
    >
      <i
        class="icon icon-sm text-primary"
        :class="{'icon-chevron-down':isOpen, 'icon-chevron-up':!isOpen}"
      />
      <slot name="header">
        <span>{{ title }}</span>
      </slot>
    </div>
    <div
      v-if="isOpen"
      class="accordion-body"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.accordion-header {
  display: flex;
  align-items: center;
  border: 1px solid var(--primary-active-bg);
  &>*{
    padding: 5px 0px 5px 0px;
  }
  I {
    margin: 0px 10px 0px 10px;
  }
}
.accordion-body {
  border: 1px solid var(--border);
  padding: 10px;
}
</style>
