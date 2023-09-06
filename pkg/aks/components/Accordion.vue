<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
export default Vue.extend({
  props: {
    title: {
      type:    String,
      default: ''
    },

    titleKey: {
      type:    String,
      default: null
    },

    openInitially: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { isOpen: this.openInitially };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

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
        class="icon text-primary"
        :class="{'icon-chevron-down':isOpen, 'icon-chevron-up':!isOpen}"
      />
      <slot name="header">
        <h4 class="mb-0">
          {{ titleKey ? t(titleKey) : title }}
        </h4>
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
.accordion-container {
  border: 1px solid var(--border)
}
.accordion-header {
  display: flex;
  align-items: center;
  // border: 1px solid var(--primary-active-bg);
  &>*{
    padding: 5px 0px 5px 0px;
  }
  I {
    margin: 0px 10px 0px 10px;
  }
}
.accordion-body {
  // border: 1px solid var(--border);
  padding: 10px;
}
</style>
