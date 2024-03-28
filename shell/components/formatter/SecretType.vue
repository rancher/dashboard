<script>
import { SERVICE_ACCOUNT } from '@shell/config/types';
export default {
  props: {
    value: {
      type:    [String, Object],
      default: 'Opaque'
    }
  },
  data() {
    if (this.value.typeDisplay) {
      this.findServiceAccount();

      return { typeDisplay: this.value.typeDisplay, serviceAccountLink: null };
    }

    return { typeDisplay: this.value, serviceAccountLink: null };
  },
  methods: {
    async findServiceAccount() {
      const serviceAccount = await this.$store.dispatch('cluster/find', { type: SERVICE_ACCOUNT, id: this.value.serviceAccountID });

      if (serviceAccount) {
        this.serviceAccountLink = serviceAccount.detailLocation;
      }
    }
  }
};
</script>>

<template>
  <router-link
    v-if="serviceAccountLink"
    :to="serviceAccountLink"
  >
    {{ typeDisplay }}
  </router-link>
  <div v-else>
    {{ typeDisplay }}
  </div>
</template>
