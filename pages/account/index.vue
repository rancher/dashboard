<script>
import PromptChangePassword from '@/components/PromptChangePassword';
import { NORMAN, MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';
import { mapGetters } from 'vuex';

import ResourceTable from '@/components/ResourceTable';

export default {
  components: {
    PromptChangePassword, Loading, ResourceTable
  },
  async fetch() {
    this.canChangePassword = await this.calcCanChangePassword();
    this.apiKeys = await this.fetchApiKeys();
  },
  data() {
    return {
      apiKeys:           null,
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
    async fetchApiKeys() {
      const rows = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.TOKEN, opt: { force: true } });

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

      return !rows ? [] : rows.filter(isApiKey);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1 v-t="'accountAndKeys.title'" />
    <section class="account">
      <h4 v-t="'accountAndKeys.account.title'" />
      <div class="content">
        <div class="col mt-10">
          <div><t k="accountAndKeys.account.name" />: {{ principal.name }}</div>
          <div><t k="accountAndKeys.account.username" />: {{ principal.loginName }}</div>
        </div>
        <button
          v-if="canChangePassword"
          type="button"
          class="btn role-secondary"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t("accountAndKeys.account.change") }}
        </button>
      </div>
      <PromptChangePassword ref="promptChangePassword" />
    </section>

    <section>
      <h4 v-t="'accountAndKeys.keys.title'" />

      <!-- account.apiKeys.title -->
      <!-- account.apiKeys.add.label -->
      <!--  -->
      <button class="btn role-primary" @click="addKey">
        {{ t('account.apiKeys.add.label') }}
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
    </section>
  </div>
</template>

<style lang='scss' scoped>
  section {
    margin-bottom: 10px;
  }

  .account {
    .content {
      display: flex;
    }
  }
</style>
