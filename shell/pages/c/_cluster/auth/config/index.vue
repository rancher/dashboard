<script>
import { MANAGEMENT } from '@shell/config/types';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { RcCounterBadge } from '@components/Pill';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import AuthProviderRow from '@shell/components/auth/AuthProviderRow.vue';
import AuthProvidersEmptyState from '@shell/components/auth/AuthProvidersEmptyState.vue';
import DisableLocalLoginCard from '@shell/components/auth/DisableLocalLoginCard.vue';
import { HIDE_LOCAL_AUTH_PROVIDER } from '@shell/store/features';
import { MODE, _EDIT } from '@shell/config/query-params';
import { LOCAL_AUTH_ID, UNSUPPORTED_AUTH_IDS } from '@shell/utils/auth';
import { sortBy } from '@shell/utils/sort';

const resource = MANAGEMENT.AUTH_CONFIG;

export default {
  name:       'AuthConfigList',
  components: {
    ActionMenu,
    AuthProviderRow,
    AuthProvidersEmptyState,
    Banner,
    DisableLocalLoginCard,
    Loading,
    RcCounterBadge,
  },

  async fetch() {
    this.allConfigs = await this.$store.dispatch('management/findAll', { type: resource });
  },

  data() {
    return {
      allConfigs:  [],
      toggleError: null,
    };
  },

  computed: {
    rows() {
      return this.allConfigs.filter((c) => c.enabled && c.id !== LOCAL_AUTH_ID);
    },

    localConfig() {
      return this.allConfigs.find((c) => c.id === LOCAL_AUTH_ID);
    },

    disableLocalAuth() {
      return this.$store.getters['features/get'](HIDE_LOCAL_AUTH_PROVIDER);
    },

    localAuthFeature() {
      return this.$store.getters['management/byId'](MANAGEMENT.FEATURE, HIDE_LOCAL_AUTH_PROVIDER);
    },

    /**
     * The switch writes a feature flag, which needs both the schema permission and
     * a flag the server hasn't locked to a fixed value.
     */
    canToggleLocalAuth() {
      const schema = this.$store.getters['management/schemaFor'](MANAGEMENT.FEATURE);
      const canUpdate = (schema?.resourceMethods || []).includes('PUT');

      return canUpdate && !!this.localAuthFeature && this.localAuthFeature.status?.lockedValue === null;
    },

    providerTypes() {
      const configurable = this.allConfigs.filter((c) => c.id !== LOCAL_AUTH_ID && !UNSUPPORTED_AUTH_IDS.includes(c.id));

      return sortBy(configurable, ['sideLabel', 'provider']);
    },

    localDescription() {
      return this.localConfig?.description || this.t('authConfig.list.localRow.description');
    },

    localUsersRoute() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          cluster: this.$route.params.cluster, product: 'auth', resource: MANAGEMENT.USER
        }
      };
    },

    brandingRoute() {
      return {
        name:   'c-cluster-settings-brand',
        params: { cluster: this.$route.params.cluster }
      };
    }
  },

  methods: {
    promptAddProvider() {
      this.$store.dispatch('management/promptModal', {
        component:      'AddAuthProviderDialog',
        modalWidth:     '960px', // AppModal ignores a width with no unit and falls back to 600px
        height:         'auto',
        styles:         'max-height: 100vh;',
        componentProps: {
          rows:     this.providerTypes,
          selectCb: (id) => this.$router.push(this.editLocation({ id })),
        },
      });
    },

    editLocation(row) {
      return {
        name:   'c-cluster-auth-config-id',
        params: { cluster: this.$route.params.cluster, id: row.id },
        query:  { [MODE]: _EDIT }
      };
    },

    chipsFor(row) {
      return row.sideLabel ? [row.sideLabel] : [];
    },

    async setDisableLocalAuth(value) {
      const feature = this.localAuthFeature;

      if (!feature) {
        return;
      }

      this.toggleError = null;
      feature.spec.value = value;

      try {
        await feature.save();
      } catch (e) {
        feature.spec.value = !value;
        this.toggleError = e.message || e;
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <header class="auth-config-header">
      <div class="auth-config-header__title">
        <h1 class="m-0">
          {{ t('authConfig.list.title') }}
        </h1>
        <p class="text-muted m-0">
          {{ t('authConfig.list.description') }}
        </p>
      </div>
    </header>

    <Banner
      v-if="toggleError"
      color="error"
      :label="toggleError"
    />

    <!-- Nothing to disable local login in favour of until a provider is configured -->
    <DisableLocalLoginCard
      v-if="rows.length"
      :value="disableLocalAuth"
      :disabled="!canToggleLocalAuth"
      @update:value="setDisableLocalAuth"
    />

    <div class="auth-config-section-header">
      <div class="auth-config-section-header__label">
        <h2 class="auth-config-section-title">
          {{ t('authConfig.list.external') }}
        </h2>
        <RcCounterBadge
          type="inactive"
          :count="rows.length"
        />
      </div>
      <router-link
        :to="brandingRoute"
        data-testid="auth-config-customise-login"
      >
        {{ t('authConfig.list.customiseLogin') }}
      </router-link>
    </div>

    <!--
      Rancher runs one external provider at a time, so the picker is only offered
      while there is none - a different provider means disabling this one first.
    -->
    <AuthProvidersEmptyState
      v-if="!rows.length"
      @create="promptAddProvider"
    />

    <template v-else>
      <AuthProviderRow
        v-for="row in rows"
        :key="row.id"
        :title="row.provider"
        :icon="row.icon"
        :chips="chipsFor(row)"
        :description="row.description"
        :meta="row.id"
        status="success"
        :status-label="row.stateDisplay"
        :to="editLocation(row)"
        :data-testid="`auth-config-row-${ row.id }`"
      >
        <template #trailing>
          <ActionMenu
            :resource="row"
            :button-aria-label="t('sortableTable.tableActionsLabel', { resource: row.id })"
          />
        </template>
      </AuthProviderRow>
    </template>

    <h2 class="auth-config-section-title auth-config-section-title--standalone">
      {{ t('authConfig.list.local') }}
    </h2>

    <!-- Nothing follows local, so it has nothing to be parted from -->
    <AuthProviderRow
      v-if="localConfig"
      :divided="false"
      :title="t('authConfig.list.localRow.title')"
      :chips="[t('authConfig.list.localRow.chip')]"
      :description="localDescription"
      :meta="t('authConfig.list.localRow.meta')"
      :status="disableLocalAuth ? 'none' : 'success'"
      :status-label="disableLocalAuth ? t('authConfig.list.localRow.disabled') : t('authConfig.list.localRow.active')"
      data-testid="auth-config-row-local"
    >
      <template #meta-trailing>
        <router-link :to="localUsersRoute">
          {{ t('authConfig.list.localRow.manageUsers') }}
        </router-link>
      </template>
    </AuthProviderRow>
  </div>
</template>

<style lang="scss" scoped>
.auth-config-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;

  &__title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.auth-config-section-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin: 20px 0;

  &__label {
    align-items: center;
    display: flex;
    gap: 8px;
  }
}

.auth-config-section-title {
  margin: 0;
  color: var(--label-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.6px;
  line-height: 18px;
  text-transform: uppercase;

  &--standalone {
    margin: 20px 0;
  }
}
</style>
