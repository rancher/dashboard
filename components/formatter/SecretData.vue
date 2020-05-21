<script>
import Date from '@/components/formatter/Date';

export default {
  components: { Date },
  props:      {
    value: {
      type:     [Object, String],
      default: null,
    },
    row: {
      type:     Object,
      required: true
    },
  },

  data() {
    if (this.value.issuer) {
      const { issuer, notAfter } = this.value;

      return {
        issuer, expiration: notAfter, isTLS:      true
      };
    } else {
      return { isTLS: false };
    }
  }
};
</script>

<template>
  <div v-if="isTLS">
    Issuer: {{ issuer }} <br />
    Expires: <Date :value="expiration" />
  </div>
  <div v-else>
    {{ value }}
  </div>
</template>
