<script>
// This component will become redundant in 2023, see https://docs.microsoft.com/en-us/graph/migrate-azure-ad-graph-overview
import { NORMAN, MANAGEMENT } from '@/config/types';
import { get } from '@/utils/object';
import { AZURE_MIGRATED } from '@/config/labels-annotations';
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
    const backToRancher = this.$store.getters['backToRancherGlobalLink'];

    return {
      authConfig:      null,
      authConfigLink: `${ backToRancher }/security/authentication`
    };
  },
  computed: {
    showWarning() {
      if (!this.authConfig) {
        return false;
      }
      // force re-compute if the authConfig is updated in another window
      // eslint-disable-next-line no-unused-vars
      const endpoint = this.authConfig?.graphEndpoint;

      return (
        get(this.authConfig, `_annotations."${ AZURE_MIGRATED }"`) !== 'true' &&
        this.authConfig.enabled
      );
    }
  },
};
</script>

<template>
  <div v-if="showWarning" id="azure-warn" class="banner">
    <p>
      {{ t('authConfig.azuread.updateEndpoint.banner.message') }}
      <a target="_blank" rel="noopener noreferrer nofollow" :href="authConfigLink">
        {{ t('authConfig.azuread.updateEndpoint.banner.linkText') }}
      </a>
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
