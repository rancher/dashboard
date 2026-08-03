<script>
import { MANAGEMENT } from '@shell/config/types';
import SortableTable from '@shell/components/SortableTable';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { HIDE_LOCAL_AUTH_PROVIDER } from '@shell/store/features';
import { STATE, AGE } from '@shell/config/table-headers';
import { MODE, _EDIT } from '@shell/config/query-params';
import { LOCAL_AUTH_ID } from '@shell/utils/auth';

const resource = MANAGEMENT.AUTH_CONFIG;

export default {
  name:       'AuthConfigList',
  components: {
    SortableTable, Banner, Loading
  },

  async fetch() {
    this.allConfigs = await this.$store.dispatch('management/findAll', { type: resource });
  },

  data() {
    return {
      allConfigs:       [],
      disableLocalAuth: this.$store.getters['features/get'](HIDE_LOCAL_AUTH_PROVIDER)
    };
  },

  computed: {
    /**
     * A configured provider is an authconfig that has been enabled. The rest are
     * pre-created singletons that stand in for a provider type you could add, and
     * belong in the create catalogue rather than here.
     */
    rows() {
      return this.allConfigs.filter((c) => c.enabled && c.id !== LOCAL_AUTH_ID);
    },

    headers() {
      return [
        STATE,
        {
          name:     'name',
          labelKey: 'tableHeaders.name',
          value:    'id',
          sort:     ['id']
        },
        {
          name:     'provider',
          labelKey: 'authConfig.list.provider',
          value:    'provider',
          sort:     ['provider', 'id']
        },
        {
          name:     'category',
          labelKey: 'authConfig.list.category',
          value:    'sideLabel',
          sort:     ['sideLabel', 'provider']
        },
        AGE
      ];
    },

    createLocation() {
      return {
        name:   'c-cluster-auth-config-create',
        params: { cluster: this.$route.params.cluster }
      };
    },

    localUsersRoute() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          cluster: this.$route.params.cluster, product: 'auth', resource: MANAGEMENT.USER
        }
      };
    }
  },

  methods: {
    editLocation(row) {
      return {
        name:   'c-cluster-auth-config-id',
        params: { cluster: this.$route.params.cluster, id: row.id },
        query:  { [MODE]: _EDIT }
      };
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <header class="auth-config-header">
      <h1 class="m-0">
        {{ t('authConfig.list.title') }}
      </h1>
      <router-link
        :to="createLocation"
        class="btn role-primary"
        data-testid="auth-config-create"
      >
        {{ t('generic.create') }}
      </router-link>
    </header>

    <Banner
      v-if="!rows.length"
      :label="t('authConfig.noneEnabled')"
      color="info"
    >
      <div>
        {{ t('authConfig.localEnabled') }}
        <router-link :to="localUsersRoute">
          {{ t('authConfig.manageLocal') }}
        </router-link>
        <br><br>
        <span
          v-if="disableLocalAuth"
          v-clean-html="t('authConfig.bannerEnableAuthProvider', {}, true)"
        />
        <template v-else>
          {{ t('authConfig.noneEnabled') }}
        </template>
      </div>
    </Banner>

    <SortableTable
      v-else
      :rows="rows"
      :headers="headers"
      :table-actions="false"
      :row-actions="false"
      key-field="id"
      default-sort-by="provider"
    >
      <template #cell:name="{ row }">
        <router-link :to="editLocation(row)">
          {{ row.id }}
        </router-link>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.auth-config-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>
