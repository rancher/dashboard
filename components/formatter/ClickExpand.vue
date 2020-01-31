<script>
export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    maxLength: {
      type:    Number,
      default: 20
    }
  },
  data() {
    const expanded = this.value.length <= this.maxLength;

    return { expanded };
  },
  computed: {
    preview() {
      if (this.expanded) {
        return this.value;
      } else {
        return this.value.slice(0, this.maxLength);
      }
    }
  },
  methods: {
    expand() {
      this.expanded = !this.expanded;
    }
  }

};
</script>

<template>
  <span @click.stop="expand">
    {{ preview }}
    <span v-if="!expanded">
      ...
    </span>
  </span>
</template>
