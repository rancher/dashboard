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
      type:    [Boolean, Function],
      default: true,
    }
  },

  data() {
    let expanded = false;

    if ( typeof this.expanded === 'function' ) {
      expanded = this.expanded(this.id);
    } else {
      expanded = this.expanded === true;
    }

    return { isExpanded: expanded };
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

      <i :class="{'icon': true, 'icon-chevron-right': !isExpanded, 'icon-chevron-down': isExpanded}" />
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
    border-top: solid thin var(--border);
    font-size: 14px;
    padding: 10px;
    position: relative;
    cursor: pointer;

    > I {
      position: absolute;
      right: 10px;
    }

    > A {
      display: block;
    }
  }
</style>
