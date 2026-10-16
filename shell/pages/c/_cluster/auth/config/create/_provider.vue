<script>
import { provide, reactive } from 'vue';
import Loading from '@shell/components/Loading';
import FailWhale from '@shell/components/FailWhale';
import { RcButton } from '@components/RcButton';
import { RcSeparator } from '@components/RcSeparator';
import AuthProviderLogo from '@shell/components/auth/AuthProviderLogo.vue';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { CLONE_CONFIG } from '@shell/config/query-params';
import { isRancherPrime } from '@shell/config/version';
import { providerKey } from '@shell/models/management.cattle.io.authconfig';
import { canEnableAuthProvider, cloneableAuthConfigFields, nextAuthConfigName, toProviderTypes } from '@shell/utils/auth-providers';
import { MULTIPLE_AUTH_PROVIDERS } from '@shell/store/features';
import { allHash } from '@shell/utils/promise';

const resource = MANAGEMENT.AUTH_CONFIG;

export default {
  name:       'AuthConfigCreateProvider',
  components: {
    AuthProviderLogo,
    FailWhale,
    Loading,
    RcButton,
    RcSeparator,
  },

  setup() {
    // The provider form creates the config itself when it first saves, and takes
    // the name from here to do it. `takenIds` is what it validates that name against.
    // `cloneValues` are the settings of the config being cloned, if any.
    const authConfigCreate = reactive({
      name: '', normanType: '', takenIds: [], created: false, cloneValues: null
    });

    provide('authConfigCreate', authConfigCreate);

    return { authConfigCreate };
  },

  async fetch() {
    const hash = await allHash({
      configs: this.$store.dispatch('management/findAll', { type: resource }),
      types:   this.$store.dispatch('auth/getAuthProviderTypes'),
    });

    const providerTypes = toProviderTypes(hash.types, { withFallback: this.$store.getters['i18n/withFallback'] });
    const type = providerTypes.find((candidate) => candidate.id === this.provider);

    if (!type) {
      return;
    }

    if (!canEnableAuthProvider(hash.configs, this.$store.getters['features/get'](MULTIPLE_AUTH_PROVIDERS))) {
      this.limitReached = true;

      return;
    }

    this.type = type;
    this.authConfigCreate.normanType = type.configTypeName;
    // Existing configs are here only to keep the new one from colliding with them
    this.authConfigCreate.takenIds = hash.configs.map((config) => config.id);
    this.authConfigCreate.name = nextAuthConfigName(this.authConfigCreate.takenIds, this.provider);

    if (this.cloneId) {
      this.cloneSource = hash.configs.find((config) => config.id === this.cloneId && providerKey(config._type) === this.provider) || null;

      if (!this.cloneSource) {
        return;
      }

      const source = await this.$store.dispatch('rancher/find', {
        type: NORMAN.AUTH_CONFIG,
        id:   this.cloneId,
        opt:  { url: `/v3/${ NORMAN.AUTH_CONFIG }/${ this.cloneId }`, force: true }
      });
      const fields = this.$store.getters['rancher/schemaFor'](type.configTypeName)?.resourceFields || {};

      this.authConfigCreate.cloneValues = cloneableAuthConfigFields(source, fields);
    }

    // The form is filled in against an empty config of the chosen provider's type
    this.value = await this.$store.dispatch('management/create', { type: resource, _type: type.configTypeName });
    this.editComponent = this.$store.getters['type-map/importEdit'](resource, this.provider);
  },

  data() {
    return {
      type:          null,
      value:         null,
      editComponent: null,
      limitReached:  false,
      cloneSource:   null,
    };
  },

  computed: {
    provider() {
      return this.$route.params.provider;
    },

    cloneId() {
      return this.$route.query?.[CLONE_CONFIG];
    },

    title() {
      if (this.cloneSource) {
        return this.t('authConfig.create.clone.title', { name: this.cloneSource.nameDisplay });
      }

      return this.t('authConfig.create.provider.title', { provider: this.displayName });
    },

    icon() {
      return this.type?.icon || '';
    },

    displayName() {
      return this.type?.name || this.provider;
    },

    /** Why the form cannot be shown, if it cannot. */
    failure() {
      // A request that failed says nothing about whether the provider is supported
      if (this.$fetchState.error) {
        return this.$fetchState.error;
      }

      if (this.limitReached) {
        return new Error(this.t(isRancherPrime() ? 'authConfig.create.limitReachedPrime' : 'authConfig.create.limitReached'));
      }

      if (!this.type) {
        return new Error(this.t('authConfig.create.unknownProvider', { provider: this.provider }));
      }

      return this.cloneId && !this.cloneSource ? new Error(this.t('authConfig.create.clone.notFound', { name: this.cloneId })) : null;
    },

    listLocation() {
      return {
        name:   'c-cluster-auth-config',
        params: { cluster: this.$route.params.cluster }
      };
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <FailWhale
    v-else-if="failure"
    :error="failure"
    data-testid="auth-config-create-failure"
  >
    <template #actions>
      <p class="mt-20">
        <rc-button
          size="large"
          :to="listLocation"
          data-testid="auth-config-back"
        >
          {{ t('authConfig.create.back') }}
        </rc-button>
      </p>
    </template>
  </FailWhale>
  <div v-else>
    <div class="auth-config-masthead">
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
      <h1
        class="auth-config-title"
        data-testid="auth-config-create-title"
      >
        <AuthProviderLogo :icon="icon" />
        {{ title }}
      </h1>
    </div>

    <RcSeparator class="mb-20" />

    <component
      :is="editComponent"
      v-if="editComponent"
      :value="value"
      :initial-value="value"
      :live-value="value"
      mode="edit"
      real-mode="edit"
      as="config"
    />
  </div>
</template>

<style lang="scss" scoped>
.auth-config-masthead {
  margin-bottom: 20px;
}

.auth-config-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
}

a.rc-button.variant-link.auth-config-back {
  padding: 0; // left-align the link with the heading below it
}

</style>
