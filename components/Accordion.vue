<script>
export default {
  props: {
    id: {
      type:     String,
      required: true
    },

    label: {
      type:     String,
      required: true,
    },

    expanded: {
      type:    Boolean,
      default: true,
    }
  },

  data() {
    return { isExpanded: this.expanded !== false };
  },

  methods: {
    toggle() {
      this.isExpanded = !this.isExpanded;
      this.$emit('on-toggle', this.id, this.isExpanded);
    }
  }
};
</script>

<template>
  <div class="accordion">
    <div class="header" @click="toggle">
      <slot name="header">
        {{ label }}
      </slot>

      <i :class="{'icon': true, 'icon-chevron-up': !isExpanded, 'icon-chevron-down': isExpanded}" />
    </div>
    <transition name="slide" mode="out-in">
      <div v-if="isExpanded" class="body">
        <slot />
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
  .header {
    //background-color: var(--nav-pkg);
    border-bottom: solid thin var(--border);
    font-size: 14px;
    padding: 10px;
    position: relative;

    > I {
      position: absolute;
      right: 10px;
    }

    > A {
      display: block;
    }
  }
</style>
