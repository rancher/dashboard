<script>
export default {
  inject: ['addTab', 'removeTab'],

  props: {
    label: {
      type:     String,
      default: null,
    },

    labelKey: {
      type:     String,
      default: null,
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

  computed: {
    labelDisplay() {
      if ( this.labelKey ) {
        return this.$store.getters['i18n/t'](this.labelKey);
      }

      if ( this.label ) {
        return this.label;
      }

      return this.name;
    },
  },

  watch: {
    active(neu) {
      if (neu) {
        this.$emit('active');
      }
    }
  },

  mounted() {
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
