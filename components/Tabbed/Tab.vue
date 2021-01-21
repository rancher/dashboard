<script>
export default {
  inject: ['addTab', 'removeTab', 'sideTabs'],

  props: {
    label: {
      default: null,
      type:    String
    },
    labelKey: {
      default: null,
      type:    String
    },
    name: {
      required: true,
      type:     String
    },
    tooltip: {
      default: null,
      type:    [String, Object]
    },
    weight: {
      default:  0,
      required: false,
      type:     Number
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
    <h2 v-if="sideTabs">
      {{ label }}
      <i v-if="tooltip" v-tooltip="tooltip" class="icon icon-info icon-lg" />
    </h2>
    <slot />
  </section>
</template>
