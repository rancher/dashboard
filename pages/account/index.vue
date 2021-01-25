<script>
import PromptChangePassword from '@/components/PromptChangePassword';
import { NORMAN, MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';
import Principal from '@/components/auth/Principal';
import { mapGetters } from 'vuex';

import ResourceTable from '@/components/ResourceTable';

export default {
  components: {
    PromptChangePassword, Loading, ResourceTable, Principal
  },
  async fetch() {
    this.canChangePassword = await this.calcCanChangePassword();
    this.rows = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.TOKEN, opt: { force: true } });
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
      return this.$store.getters['type-map/headersFor'](this.apiKeySchema);
    },

    apiKeySchema() {
      return this.$store.getters[`management/schemaFor`](MANAGEMENT.TOKEN);
    },

    principal() {
      return this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, this.$store.getters['auth/principalId']) || {};
    },

    apiKeys() {
      // Filter out tokens that are not API Keys
      const isApiKey = (key) => {
        const labels = key.metadata?.labels;
        const kind = labels ? labels['authn.management.cattle.io/kind'] : '';

        // Note: The ember ui looked for the label 'ui-session' - with Steve, this seems to npw
        // be the label 'authn.management.cattle.io/kind'' with the value 'session

        // TODO: Don't understand the Ember logic:
        // return  ( !expired || !labels || !labels['ui-session'] ) && !current;
        // For the Steve API, current always seems to be false, even for the current UI Session token
        // Show the Token if is not a session token and its it not current
        return kind !== 'session' && !key.current;
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
    <h1 v-t="'accountAndKeys.title'" />

    <h4 v-t="'accountAndKeys.account.title'" />
    <div class="account">
      <Principal :key="principal.id" :value="principal.id" :use-muted="false" />
      <button
        v-if="canChangePassword"
        type="button"
        class="btn role-primary"
        @click="$refs.promptChangePassword.show(true)"
      >
        {{ t("accountAndKeys.account.change") }}
      </button>
    </div>
    <PromptChangePassword ref="promptChangePassword" />

    <hr />
    <h4 v-t="'accountAndKeys.apiKeys.title'" />
    <div class="keys">
      <button class="btn role-primary add" @click="addKey">
        {{ t('accountAndKeys.apiKeys.add.label') }}
      </button>
      <ResourceTable
        :schema="apiKeySchema"
        :rows="apiKeys"
        :headers="apiKeyheaders"
        key-field="id"
        :search="false"
        :row-actions="true"
        :table-actions="true"
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

  .keys {
    display: flex;
    flex-direction: column;
    .add {
      align-self: flex-end;
    }
  }
</style>
