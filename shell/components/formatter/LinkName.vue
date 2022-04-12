<script>
import { NAME as EXPLORER } from '@shell/config/product/explorer';

export default {
  props: {
    value: {
      type:     String,
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
    }
  },

  computed: {
    url() {
      const name = `c-cluster-product-resource${ this.namespace ? '-namespace' : '' }-id`;

      const params = {
        resource:  this.type,
        namespace: this.namespace,
        id:        this.value,
        product:   this.product,
      };

      return { name, params };
    }
  }
};
</script>

<template>
  <span>
    <nuxt-link :to="url">
      {{ value }}
    </nuxt-link>
  </span>
</template>
