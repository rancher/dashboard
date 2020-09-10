<script>
import { BACKUP_RESTORE } from '@/config/types';
export default {
  props: {
    value: {
      type:     String,
      required: true
    }
  },

  computed: {
    to() {
      const { cluster } = this.$route.params;

      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster,
          product:  'backup',
          resource: BACKUP_RESTORE.RESOURCE_SET,
          id:       this.value
        }
      };
    }
  }
};
</script>

<template>
  <nuxt-link :to="to">
    {{ value }}
  </nuxt-link>
</template>
