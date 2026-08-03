<script>
import { MANAGEMENT } from '@shell/config/types';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import { sortBy } from '@shell/utils/sort';
import { MODE, _EDIT } from '@shell/config/query-params';
import Loading from '@shell/components/Loading';
import { LOCAL_AUTH_ID, UNSUPPORTED_AUTH_IDS } from '@shell/utils/auth';

const resource = MANAGEMENT.AUTH_CONFIG;

export default {
  name:       'AuthConfigCreate',
  components: { SelectIconGrid, Loading },

  async fetch() {
    this.allConfigs = await this.$store.dispatch('management/findAll', { type: resource });
  },

  data() {
    return { allConfigs: [] };
  },

  computed: {
    /**
     * The catalogue of provider types you can configure. Rancher pre-creates one
     * authconfig per supported type, so those singletons double as the type list.
     */
    rows() {
      const types = this.allConfigs.filter((c) => {
        return c.id !== LOCAL_AUTH_ID && !UNSUPPORTED_AUTH_IDS.includes(c.id);
      });

      return sortBy(types, ['sideLabel', 'nameDisplay']);
    },

    listLocation() {
      return {
        name:   'c-cluster-auth-config',
        params: { cluster: this.$route.params.cluster }
      };
    }
  },

  methods: {
    colorFor(row) {
      const types = ['ldap', 'oauth', 'saml', 'oidc'];

      const idx = types.indexOf(row.configType);

      if ( idx === -1 ) {
        return 'color8';
      }

      return `color${ idx + 1 }`;
    },

    goTo(id) {
      this.$router.push({
        name:   'c-cluster-auth-config-id',
        params: { cluster: this.$route.params.cluster, id },
        query:  { [MODE]: _EDIT }
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <header>
      <router-link
        :to="listLocation"
        class="auth-config-back"
      >
        <i class="icon icon-chevron-left" />
        {{ t('authConfig.list.title') }}
      </router-link>
      <h1 class="m-0">
        {{ t('authConfig.create.title') }}
      </h1>
      <p class="text-muted mt-10">
        {{ t('authConfig.create.description') }}
      </p>
    </header>

    <SelectIconGrid
      :rows="rows"
      :aria-label="t('authConfig.create.title')"
      :color-for="colorFor"
      name-field="provider"
      @clicked="(row) => goTo(row.id)"
    />
  </div>
</template>

<style lang="scss" scoped>
.auth-config-back {
  align-items: center;
  display: inline-flex;
  margin-bottom: 10px;
}
</style>
