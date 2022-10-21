<script>
// Added by Verrazzano
import { NAME as EXPLORER } from '@shell/config/product/explorer';

export default {
  props: {
    value: {
      type:     null,
      required: true
    },

    type: {
      type:     String,
      required: true,
    },

    namespace: {
      type:    String,
      default: '',
    },

    product: {
      type:    String,
      default: EXPLORER,
    },

    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    url() {
      const name = `c-cluster-product-resource${ this.namespace ? '-namespace' : '' }-id`;

      const params = {
        resource:  this.type,
        namespace: this.namespace,
        id:        this.value,
        product:   this.product || EXPLORER,
        cluster:   this.row.cluster
      };

      return { name, params };
    }
  }
};
</script>

<template>
  <span v-if="value">
    <nuxt-link :to="url">
      {{ value }}
    </nuxt-link>
  </span>
</template>
