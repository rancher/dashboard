<script>
import { MANAGEMENT } from '@shell/config/types';
import SelectIconGrid from '@shell/components/SelectIconGrid';
import { sortBy } from '@shell/utils/sort';
import { MODE, _EDIT } from '@shell/config/query-params';
import Loading from '@shell/components/Loading';
import { RcButton } from '@components/RcButton';
import { LOCAL_AUTH_ID, UNSUPPORTED_AUTH_IDS } from '@shell/utils/auth';

const resource = MANAGEMENT.AUTH_CONFIG;

export default {
  name:       'AuthConfigCreate',
  components: {
    SelectIconGrid, Loading, RcButton
  },

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
    <div class="auth-config-masthead">
      <h1 class="m-0">
        {{ t('authConfig.create.title') }}
      </h1>
      <rc-button
        variant="link"
        class="auth-config-back"
        :to="listLocation"
        data-testid="auth-config-back"
      >
        <template #before>
          <i class="icon icon-chevron-left" />
        </template>
        {{ t('authConfig.create.back') }}
      </rc-button>
      <p class="text-muted mt-10">
        {{ t('authConfig.create.description') }}
      </p>
    </div>

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
.auth-config-masthead {
  margin-bottom: 20px;
}

a.rc-button.variant-link.auth-config-back {
  padding: 0; // left-align the link with the heading above it
}
</style>
