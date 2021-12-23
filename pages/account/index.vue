<script>
import { mapGetters } from 'vuex';
import BackLink from '@/components/BackLink';
import PromptChangePassword from '@/components/PromptChangePassword';
import { NORMAN } from '@/config/types';
import Loading from '@/components/Loading';
import Principal from '@/components/auth/Principal';
import BackRoute from '@/mixins/back-link';

import Banner from '@/components/Banner';
import ResourceTable from '@/components/ResourceTable';

export default {
  layout:     'plain',
  components: {
    BackLink, Banner, PromptChangePassword, Loading, ResourceTable, Principal
  },
  mixins: [BackRoute],
  async fetch() {
    this.canChangePassword = await this.calcCanChangePassword();

    if (this.apiKeySchema) {
      this.rows = await this.$store.dispatch('rancher/findAll', { type: NORMAN.TOKEN });
    }
  },
  data() {
    return {
      rows:              null,
      canChangePassword: false
    };
  },
  computed:   {
    ...mapGetters({ t: 'i18n/t' }),

    apiKeyheaders() {
      return this.apiKeySchema ? this.$store.getters['type-map/headersFor'](this.apiKeySchema) : [];
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
      this.$router.push({ path: 'account/create-key' });
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
    <h1 v-t="'accountAndKeys.title'" />

    <h4 v-t="'accountAndKeys.account.title'" />
    <div class="account">
      <Principal :key="principal.id" :value="principal.id" :use-muted="false" :show-labels="true" />
      <div>
        <button
          v-if="canChangePassword"
          type="button"
          class="btn role-primary"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t("accountAndKeys.account.change") }}
        </button>
      </div>
    </div>
    <PromptChangePassword ref="promptChangePassword" />

    <hr />
    <div class="keys-header">
      <h4 v-t="'accountAndKeys.apiKeys.title'" />
      <button v-if="apiKeySchema" class="btn role-primary add mb-20" @click="addKey">
        {{ t('accountAndKeys.apiKeys.add.label') }}
      </button>
    </div>
    <div v-if="apiKeySchema" class="keys">
      <ResourceTable
        :schema="apiKeySchema"
        :rows="apiKeys"
        :headers="apiKeyheaders"
        key-field="id"
        :search="true"
        :row-actions="true"
        :table-actions="true"
      />
    </div>
    <div v-else>
      <Banner color="warning" :label="t('accountAndKeys.apiKeys.notAllowed')" />
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
    h4 {
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
</style>
