<script>
import { MANAGEMENT } from '@shell/config/types';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import { sortBy } from '@shell/utils/sort';
import { MODE, _EDIT } from '@shell/config/query-params';
import { authProvidersInfo } from '@shell/utils/auth';
import { Banner } from '@components/Banner';

export default {
  components: { SelectIconGrid, Banner },

  async asyncData({ store, redirect }) {
    const authProvs = await authProvidersInfo(store);

    if (!!authProvs.enabledLocation) {
      redirect(authProvs.enabledLocation);
    }

    return { nonLocal: authProvs.nonLocal, enabled: authProvs.enabled };
  },

  data() {
    const resource = MANAGEMENT.AUTH_CONFIG;
    const getters = this.$store.getters;
    const inStore = getters['currentStore'](resource);
    const hasListComponent = getters['type-map/hasCustomList'](resource);
    const hasEditComponent = getters['type-map/hasCustomEdit'](resource);
    const schema = getters[`${ inStore }/schemaFor`](resource);

    return {
      resource,
      schema,
      hasListComponent,
      hasEditComponent,

      // Provided by asyncData later
      nonLocal: null,
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
  <div>
    <h1 class="m-0">
      {{ displayName }}
    </h1>
    <Banner
      v-if="!enabled.length"
      :label="t('authConfig.noneEnabled')"
      color="info"
    >
      {{ t('authConfig.localEnabled') }}
      <nuxt-link :to="localUsersRoute">
        {{ t('authConfig.manageLocal') }}
      </nuxt-link>
      <br>
      {{ t('authConfig.noneEnabled') }}
    </Banner>
    <SelectIconGrid
      :rows="rows"
      :color-for="colorFor"
      name-field="provider"
      @clicked="(row) => goTo(row.id)"
    />
  </div>
</template>
