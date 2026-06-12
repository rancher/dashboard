<script>
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import { sortBy } from '@shell/utils/sort';
import { MODE, _EDIT } from '@shell/config/query-params';
import { authProvidersInfo } from '@shell/utils/auth';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';

const resource = MANAGEMENT.AUTH_CONFIG;

export default {
  components: {
    SelectIconGrid, Banner, Loading
  },

  async fetch() {
    const authProvs = await authProvidersInfo(this.$store);

    if (!!authProvs.enabledLocation) {
      return this.$router.replace(authProvs.enabledLocation);
    }

    this['enabled'] = authProvs.enabled;
    this['nonLocal'] = authProvs.nonLocal;

    try {
      const setting = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.SETTING,
        id:   SETTING.DISABLE_LOCAL_AUTH,
        opt:  { url: `/v1/${ MANAGEMENT.SETTING }/${ SETTING.DISABLE_LOCAL_AUTH }` }
      });

      this['disableLocalAuth'] = (setting?.value || setting?.default) === 'true';
    } catch {
      this['disableLocalAuth'] = false;
    }
  },

  data() {
    return {
      // Provided by fetch later
      enabled:          false,
      nonLocal:         null,
      disableLocalAuth: false,
    };
  },

  computed: {
    rows() {
      return sortBy(this.nonLocal, ['sideLabel', 'nameDisplay']);
    },

    displayName() {
      return this.$store.getters['type-map/labelFor'](this.schema, 2);
    },

    localUsersRoute() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          cluster: this.$route.params.cluster, product: 'auth', resource: MANAGEMENT.USER
        }
      };
    },

    inStore() {
      return this.$store.getters['currentStore'](resource);
    },

    schema() {
      return this.$store.getters[`${ this.inStore }/schemaFor`](resource);
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
        params: { id },
        query:  { [MODE]: _EDIT }
      });
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1 class="m-0">
      {{ displayName }}
    </h1>
    <Banner
      v-if="!enabled.length"
      :label="t('authConfig.noneEnabled')"
      color="info"
    >
      <div>
        {{ t('authConfig.localEnabled') }}
        <router-link :to="localUsersRoute">
          {{ t('authConfig.manageLocal') }}
        </router-link>
        <br>
        <template v-if="disableLocalAuth">
          {{ t('authConfig.noneEnabledDisableLocalAuth') }}
        </template>
        <template v-else>
          {{ t('authConfig.noneEnabled') }}
        </template>
      </div>
    </Banner>
    <SelectIconGrid
      :rows="rows"
      :color-for="colorFor"
      name-field="provider"
      @clicked="(row) => goTo(row.id)"
    />
  </div>
</template>
