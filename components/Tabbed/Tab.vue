<script>
export default {
  inject: ['addTab', 'removeTab'],

  props: {
    label: {
      type:     String,
      required: true,
    },
    name: {
      type:     String,
      required: true,
    },
    weight: {
      type:     Number,
      default:  0,
      required: false,
    },
    canToggle: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { active: null };
  },

  watch: {
    active(neu) {
      if (neu) {
        this.$emit('active');
      }
    }
  },

  created() {
    this.addTab(this);
  },

  beforeDestroy() {
    this.removeTab(this);
  }
};
</script>

<template>
  <section
    v-show="active"
    :id="name"
    :aria-hidden="!active"
    role="tabpanel"
  >
    <slot />
  </section>
</template>
