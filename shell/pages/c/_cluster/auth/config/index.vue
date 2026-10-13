<script>
import { MANAGEMENT } from '@shell/config/types';
import { isRancherPrime } from '@shell/config/version';
import { providerIcon, providerKey } from '@shell/models/management.cattle.io.authconfig';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import Loading from '@shell/components/Loading';
import { RcCounterBadge } from '@components/Pill';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import AuthProviderAccessDrawer from '@shell/components/auth/AuthProviderAccessDrawer.vue';
import AuthProviderRow from '@shell/components/auth/AuthProviderRow.vue';
import AuthProvidersEmptyState from '@shell/components/auth/AuthProvidersEmptyState.vue';
import AuthProvidersPrimeNotice from '@shell/components/auth/AuthProvidersPrimeNotice.vue';
import DisableLocalLoginCard from '@shell/components/auth/DisableLocalLoginCard.vue';
import { HIDE_LOCAL_AUTH_PROVIDER, MULTIPLE_AUTH_PROVIDERS } from '@shell/store/features';
import { MODE, _EDIT } from '@shell/config/query-params';
import { LOCAL_AUTH_ID, UNSUPPORTED_AUTH_IDS, canWriteLocalAuthFeature, localAuthFeature } from '@shell/utils/auth';
import { canEnableAuthProvider, toProviderTypes } from '@shell/utils/auth-providers';

const resource = MANAGEMENT.AUTH_CONFIG;

export default {
  name:       'AuthConfigList',
  components: {
    ActionMenu,
    AuthProviderRow,
    AuthProvidersEmptyState,
    AuthProvidersPrimeNotice,
    Banner,
    DisableLocalLoginCard,
    Loading,
    RcButton,
    RcCounterBadge,
  },

  async fetch() {
    const [configs] = await Promise.all([
      this.$store.dispatch('management/findAll', { type: resource }),
      this.loadProviderTypes(),
    ]);

    this.allConfigs = configs;
  },

  data() {
    return {
      allConfigs:    [],
      providerTypes: null,
      toggleError:   null,
    };
  },

  computed: {
    /**
     * Every provider an admin has added. Nothing is pre-created, so a config that
     * exists is one somebody made, whether or not it is currently switched on.
     * Providers the dashboard has no form for are left out, as there is nothing
     * an admin could do with their row.
    */
    rows() {
      return this.allConfigs.filter((c) => c.id !== LOCAL_AUTH_ID && !UNSUPPORTED_AUTH_IDS.includes(providerKey(c._type)));
    },

    /**
     * Local cannot be turned off until something else can let people in. A
     * provider the dashboard cannot configure still lets people in.
     */
    hasEnabledProvider() {
      return this.allConfigs.some((c) => c.id !== LOCAL_AUTH_ID && c.enabled);
    },

    multipleAllowed() {
      return this.$store.getters['features/get'](MULTIPLE_AUTH_PROVIDERS);
    },

    canAddProvider() {
      return canEnableAuthProvider(this.allConfigs, this.multipleAllowed);
    },

    /** Without Prime's `multiple-auth-providers` feature, one provider is enabled at a time. */
    showPrimeNotice() {
      return this.rows.length > 0 && !this.multipleAllowed;
    },

    localConfig() {
      return this.allConfigs.find((c) => c.id === LOCAL_AUTH_ID);
    },

    disableLocalAuth() {
      return this.$store.getters['features/get'](HIDE_LOCAL_AUTH_PROVIDER);
    },

    localAuthFeature() {
      return localAuthFeature(this.$store.getters);
    },

    canToggleLocalAuth() {
      return canWriteLocalAuthFeature(this.$store.getters);
    },

    /**
     * Local has no vendor copy of its own, so it falls back to describing what
     * the built-in accounts are for.
     */
    localDescription() {
      if (this.localConfig?.description) {
        return this.localConfig.description;
      }

      return this.disableLocalAuth ? this.t('authConfig.list.localRow.descriptionDisabled') : this.t('authConfig.list.localRow.description');
    },

    localIcon() {
      return providerIcon(LOCAL_AUTH_ID);
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
    /**
     * Only the add dialog needs the provider types, so failing to read them leaves
     * the list standing. The dialog asks for them again when it is opened.
     *
     * @returns the error, if they could not be read
     */
    async loadProviderTypes() {
      try {
        const types = await this.$store.dispatch('auth/getAuthProviderTypes');

        this.providerTypes = toProviderTypes(types, { withFallback: this.$store.getters['i18n/withFallback'] });

        return null;
      } catch (err) {
        return err;
      }
    },

    async promptAddProvider() {
      if (!this.canAddProvider) {
        return;
      }

      if (!this.providerTypes) {
        const err = await this.loadProviderTypes();

        if (err) {
          this.$store.dispatch('growl/fromError', { title: this.t('generic.notification.title.error'), err });

          return;
        }
      }

      this.$store.dispatch('management/promptModal', {
        component:      'AddAuthProviderDialog',
        modalWidth:     '960px', // AppModal ignores a width with no unit and falls back to 600px
        height:         'auto',
        styles:         'max-height: 100vh;',
        componentProps: {
          rows:            this.providerTypes,
          selectCb:        (provider) => this.$router.push(this.addLocation(provider)),
          prime:           isRancherPrime(),
          multipleAllowed: this.multipleAllowed,
        },
      });
    },

    /**
     * Where picking a provider type in the add dialog goes.
     *
     * Every connection to a provider is a config of its own, which needs a name
     * before it can be written, so adding one always starts on the create page.
     */
    addLocation(provider) {
      return {
        name:   'c-cluster-auth-config-create-provider',
        params: { cluster: this.$route.params.cluster, provider },
      };
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

    showAccess(row) {
      this.$store.commit('slideInPanel/open', {
        component:      AuthProviderAccessDrawer,
        componentProps: {
          resource:            row,
          onClose:             () => this.$store.commit('slideInPanel/close'),
          width:               'wide',
          height:              'full',
          returnFocusSelector: `[data-testid="auth-config-row-${ row.id }"] .auth-provider-row__title`,
        },
      });
    },

    setDisableLocalAuth(value) {
      if (!value) {
        return this.writeDisableLocalAuth(false);
      }

      this.$store.dispatch('management/promptModal', {
        component:      'DisableLocalLoginDialog',
        height:         'auto',
        styles:         'max-height: 100vh;',
        componentProps: { disableCb: () => this.writeDisableLocalAuth(true) },
      });
    },

    async writeDisableLocalAuth(value) {
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
      <RcButton
        v-if="rows.length && canAddProvider"
        variant="primary"
        size="large"
        data-testid="auth-config-create"
        @click="promptAddProvider"
      >
        {{ t('generic.create') }}
      </RcButton>
    </header>

    <Banner
      v-if="toggleError"
      color="error"
      :label="toggleError"
    />

    <!-- Nothing to disable local login in favour of until a provider is enabled -->
    <DisableLocalLoginCard
      v-if="hasEnabledProvider"
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

    <AuthProvidersEmptyState
      v-if="!rows.length"
      @create="promptAddProvider"
    />

    <template v-else>
      <AuthProviderRow
        v-for="row in rows"
        :key="row.id"
        :divided="rows.length > 1"
        :title="row.provider"
        :icon="row.icon"
        :chips="chipsFor(row)"
        :description="row.description"
        :meta="row.id"
        :status="row.enabled ? 'success' : 'none'"
        :status-label="row.stateDisplay"
        selectable
        :data-testid="`auth-config-row-${ row.id }`"
        @select="showAccess(row)"
      >
        <template #trailing>
          <ActionMenu
            :resource="row"
            :button-aria-label="t('sortableTable.tableActionsLabel', { resource: row.id })"
          />
        </template>
      </AuthProviderRow>
      <AuthProvidersPrimeNotice v-if="showPrimeNotice" />
    </template>

    <h2 class="auth-config-section-title auth-config-section-title--standalone">
      {{ t('authConfig.list.local') }}
    </h2>

    <!--
      Local is always there - it is how Rancher is first logged into - so the row
      is not conditional on a config being found for it. Nothing follows it, so it
      has nothing to be parted from.
    -->
    <AuthProviderRow
      :divided="false"
      :title="t('authConfig.list.localRow.title')"
      :icon="localIcon"
      :chips="[t('authConfig.list.localRow.chip')]"
      :description="localDescription"
      :meta="t('authConfig.list.localRow.meta')"
      :disabled="disableLocalAuth"
      :status="disableLocalAuth ? 'error' : 'success'"
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
