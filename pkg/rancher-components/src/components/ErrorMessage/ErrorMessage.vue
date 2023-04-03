<script>
import { Banner } from '@components/Banner';

export default {

  name: 'ErrorMessage',

  components: { Banner },

  props: {
    field: {
      type:     String,
      required: true
    }
  },

  computed: {
    
    $v() {
      return this.$parent.$v;
    },

    errorField() {
      return this.$v[this.field];
    },

    // temp
    errorMessage() {
      return `Must be between ${ this.$v.age.$params.between.min } and ${ this.$v.age.$params.between.max }`;
    }
  },

  methods: {

  }
};
</script>
<template>
  <div
    v-if="$v.$anyError"
    id="error-message"
    class="error-message"
  >
    <slot name="banner">
      <Banner
        v-if="!errorField.between"
        color="error"
        :label="errorMessage"
        :closable="false"
      />
    </slot>
  </div>
</template>
