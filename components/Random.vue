<script>

export default {
  props: {
    min: {
      type:    Number,
      default: 1
    },

    max: {
      type:    Number,
      default: 100,
    },

    decimals: {
      type:    Number,
      default: 0,
    },

    prefix: {
      type:    String,
      default: '',
    },

    suffix: {
      type:    String,
      default: '',
    },

    interval: {
      type:    Number,
      default: 5000,
    }

  },

  data() {
    return { label: this.update() };
  },

  beforeDestroy() {
    clearTimeout(this.timer);
  },

  methods: {
    update() {
      const base = ( Math.random() * (this.max - this.min)) + this.min;
      const factor = 10 ** this.decimals;
      const value = Math.round(base * factor) / factor;

      const label = (this.prefix || '') + value + (this.suffix || '');

      if ( this.label !== label ) {
        this.label = label;
      }

      this.timer = setTimeout(() => {
        this.update();
      }, this.interval);

      return this.label;
    }
  }
};
</script>

<template>
  <span>
    {{ label }}
  </span>
</template>
