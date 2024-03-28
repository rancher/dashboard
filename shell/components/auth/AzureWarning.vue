<script>
// This component will become redundant in 2023, see https://docs.microsoft.com/en-us/graph/migrate-azure-ad-graph-overview
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import { get } from '@shell/utils/object';
import { AZURE_MIGRATED } from '@shell/config/labels-annotations';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

export default {
  async fetch() {
    // Check for access to steve authConfigs because everyone can load the norman auth config schema
    if (
      this.$store.getters['isRancher'] &&
      this.$store.getters['management/schemaFor'](MANAGEMENT.AUTH_CONFIG)
    ) {
      this.authConfig = await this.$store.dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   'azuread',
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/azuread` }
      });
    }
  },

  data() {
    return {
      authConfig:      null,
      authConfigRoute: {
        name:   'c-cluster-auth-config-id',
        params: {
          cluster: this.$route.params.cluster || BLANK_CLUSTER,
          id:      'azuread'
        }
      }
    };
  },

  computed: {
    showWarning() {
      if (!this.authConfig) {
        return false;
      }

      return (
        get(this.authConfig, `annotations."${ AZURE_MIGRATED }"`) !== 'true' &&
        this.authConfig.enabled
      );
    }
  }
};
</script>

<template>
  <div
    v-if="showWarning"
    id="azure-warn"
    class="banner"
  >
    <p>
      {{ t('authConfig.azuread.updateEndpoint.banner.message') }}
      <router-link :to="authConfigRoute">
        {{ t('authConfig.azuread.updateEndpoint.banner.linkText') }}
      </router-link>
    </p>
  </div>
</template>

<style lang="scss" scoped>
#azure-warn {
  background-color: var(--warning);
  color: var(--warning-text);
  line-height: 2em;
  width: 100%;

  > p {
    text-align: center;
  }
}
</style>
