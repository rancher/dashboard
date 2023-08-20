<script>
import { Banner } from '@components/Banner';

export default {

  name: 'ErrorMessage',

  components: { Banner },

  props: {
    errors: {
      type: Array,
      required: true
    }
  },

  computed: {
  },

  methods: {
  }
};
</script>
<template>
  <div
    v-if="!!errors.length"
    id="error-message"
    class="error-message"
  >
    <slot name="banner">
      <Banner
        v-for="(error, i) in errors"
        :key="i"
        class=""
        color="error"
        :label="error"
      />
    </slot>
  </div>
</template>
