<script>
import BackLink from '@shell/components/BackLink';
import PromptChangePassword from '@shell/components/PromptChangePassword';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import Loading from '@shell/components/Loading';
import Principal from '@shell/components/auth/Principal';
import BackRoute from '@shell/mixins/back-link';
import { mapGetters } from 'vuex';

import { Banner } from '@components/Banner';
import ResourceTable from '@shell/components/ResourceTable';
import CopyToClipboardText from '@shell/components/CopyToClipboardText';
import TabTitle from '@shell/components/TabTitle';

const API_ENDPOINT = '/v3';

export default {
  components: {
    CopyToClipboardText, BackLink, Banner, PromptChangePassword, Loading, ResourceTable, Principal, TabTitle
  },
  mixins: [BackRoute],
  async fetch() {
    this.canChangePassword = await this.calcCanChangePassword();

    if (this.apiKeySchema) {
      this.rows = await this.$store.dispatch('rancher/findAll', { type: NORMAN.TOKEN });
    }

    // Get all settings - the API host setting may not be set, so this avoids a 404 request if we look for the specific setting
    const allSettings = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
    const apiHostSetting = allSettings.find((i) => i.id === SETTING.API_HOST);
    const serverUrlSetting = allSettings.find((i) => i.id === SETTING.SERVER_URL);

    this.apiHostSetting = apiHostSetting?.value;
    this.serverUrlSetting = serverUrlSetting?.value;
  },
  data() {
    return {
      apiHostSetting:    null,
      serverUrlSetting:  null,
      rows:              null,
      canChangePassword: false
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    apiKeyheaders() {
      return this.apiKeySchema ? this.$store.getters['type-map/headersFor'](this.apiKeySchema) : [];
    },

    // Port of Ember code for API Url - see: https://github.com/rancher/ui/blob/8e07c492673171731f3b26af14c978bc103d1828/lib/shared/addon/endpoint/service.js#L58
    apiUrlBase() {
      let setting = this.apiHostSetting;

      if (setting && setting.indexOf('http') !== 0) {
        setting = `http://${ setting }`;
      }

      // Use Server Setting URL if the api host setting is not set
      let url = setting || this.serverUrlSetting;

      // If the URL is relative, add on the current base URL from the browser
      if ( url.indexOf('http') !== 0 ) {
        url = `${ window.location.origin }/${ url.replace(/^\/+/, '') }`;
      }

      // URL must end in a single slash
      url = `${ url.replace(/\/+$/, '') }/`;

      return url;
    },

    apiUrl() {
      const base = this.apiUrlBase;
      const path = API_ENDPOINT.replace(/^\/+/, '');

      return `${ base }${ path }`;
    },

    apiKeySchema() {
      try {
        return this.$store.getters[`rancher/schemaFor`](NORMAN.TOKEN);
      } catch (e) {}

      return null;
    },

    principal() {
      const principalId = this.$store.getters['auth/principalId'];
      const principal = this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, principalId);

      if (!principal) {
        console.error('Failed to find principal with id: ', principalId); // eslint-disable-line no-console
      }

      return principal || {};
    },

    apiKeys() {
      // Filter out tokens that are not API Keys and are not expired UI Sessions
      const isApiKey = (key) => {
        const labels = key.labels;
        const expired = key.expired;
        const current = key.current;

        return ( !expired || !labels || !labels['ui-session'] ) && !current;
      };

      return !this.rows ? [] : this.rows.filter(isApiKey);
    }
  },

  methods: {
    addKey() {
      this.$router.push({ name: 'account-create-key' });
    },
    async calcCanChangePassword() {
      if (!this.$store.getters['auth/enabled']) {
        return false;
      }

      if (this.principal.provider === 'local') {
        return !!this.principal.loginName;
      }

      const users = await this.$store.dispatch('rancher/findAll', {
        type: NORMAN.USER,
        opt:  { url: '/v3/users', filter: { me: true } }
      });

      if (users && users.length === 1) {
        return !!users[0].username;
      }

      return false;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <BackLink :link="backLink" />
    <h1>
      <TabTitle breadcrumb="vendor-only">
        {{ t('accountAndKeys.title') }}
      </TabTitle>
    </h1>

    <h2 v-t="'accountAndKeys.account.title'" />
    <div class="account">
      <Principal
        :value="principal.id"
        :use-muted="false"
        :show-labels="true"
      />
      <div>
        <button
          v-if="canChangePassword"
          role="button"
          :aria-label="t('accountAndKeys.account.change')"
          type="button"
          class="btn role-primary"
          data-testid="account_change_password"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t("accountAndKeys.account.change") }}
        </button>
      </div>
    </div>
    <PromptChangePassword ref="promptChangePassword" />

    <hr>
    <div class="keys-header">
      <div>
        <h2 v-t="'accountAndKeys.apiKeys.title'" />
        <div class="api-url">
          <span>{{ t("accountAndKeys.apiKeys.apiEndpoint") }}</span>
          <CopyToClipboardText :text="apiUrl" />
        </div>
      </div>
      <button
        v-if="apiKeySchema"
        role="button"
        :aria-label="t('accountAndKeys.apiKeys.add.label')"
        class="btn role-primary add mb-20"
        data-testid="account_create_api_keys"
        @click="addKey"
      >
        {{ t('accountAndKeys.apiKeys.add.label') }}
      </button>
    </div>
    <div
      v-if="apiKeySchema"
      class="keys"
    >
      <ResourceTable
        :schema="apiKeySchema"
        :rows="apiKeys"
        :headers="apiKeyheaders"
        key-field="id"
        data-testid="api_keys_list"
        :search="true"
        :row-actions="true"
        :table-actions="true"
      />
    </div>
    <div v-else>
      <Banner
        color="warning"
        :label="t('accountAndKeys.apiKeys.notAllowed')"
      />
    </div>
  </div>
</template>

<style lang='scss' scoped>
  hr {
    margin: 20px 0;
  }

  .account {
    display: flex;
    justify-content: space-between
  }

  .keys-header {
    display: flex;
    div {
      flex: 1;
    }
  }

  .keys {
    display: flex;
    flex-direction: column;
    .add {
      align-self: flex-end;
    }
  }

  .api-url {
    display: flex;

    > span {
      margin-right: 6px;
    }
  }
</style>
