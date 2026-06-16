<script>
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { canViewResource } from '@shell/utils/auth';

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

    objectId: {
      type:    String,
      default: '',
    },

    product: {
      type:    String,
      default: '',
    }
  },

  computed: {
    url() {
      const name = `c-cluster-product-resource${ this.namespace ? '-namespace' : '' }-id`;

      const params = {
        cluster:   this.$store.getters['clusterId'],
        product:   this.product || this.$store.getters['productId'] || EXPLORER,
        resource:  this.type,
        namespace: this.namespace,
        id:        this.objectId ? this.objectId : this.value,
      };

      // Having an undefined param can yield a console warning like [Vue Router warn]: Discarded invalid param(s) "namespace" when navigating
      if (!params.namespace) {
        delete params.namespace;
      }

      return { name, params };
    },

    canViewResource() {
      return canViewResource(this.$store, this.type);
    }
  }
};
</script>

<template>
  <span v-if="value">
    <router-link
      v-if="canViewResource"
      :to="url"
    >
      {{ value }}
    </router-link>
    <template v-else>
      {{ value }}
    </template>
  </span>
</template>
