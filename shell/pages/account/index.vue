<script>
import BackLink from '@shell/components/BackLink';
import { MANAGEMENT, NORMAN, EXT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import Loading from '@shell/components/Loading';
import Principal from '@shell/components/auth/Principal';
import BackRoute from '@shell/mixins/back-link';
import { mapGetters } from 'vuex';

import { Banner } from '@components/Banner';
import ResourceTable from '@shell/components/ResourceTable';
import TabTitle from '@shell/components/TabTitle';

import { allHash } from '@shell/utils/promise';

import {
  ACCESS_KEY, DESCRIPTION, EXPIRES, EXPIRY_STATE,
  LAST_USED, AGE_NORMAN, SCOPE_NORMAN, NORMAN_KEY_DEPRECATION
} from '@shell/config/table-headers';
import { FilterArgs, PaginationParamFilter } from '@shell/types/store/pagination.types';

export default {
  components: {
    BackLink, Banner, Loading, ResourceTable, Principal, TabTitle
  },
  mixins: [BackRoute],
  async fetch() {
    const hashedRequests = {};

    this.canChangePassword = await this.calcCanChangePassword();

    this.normanTokenSchema = this.$store.getters[`rancher/schemaFor`](NORMAN.TOKEN);
    this.steveTokenSchema = this.$store.getters[`management/schemaFor`](EXT.TOKEN);

    const selfUser = await this.$store.dispatch('auth/getSelfUser');

    if (this.normanTokenSchema) {
      hashedRequests.normanTokens = this.$store.dispatch('rancher/findAll', { type: NORMAN.TOKEN });
    }

    if (this.steveTokenSchema) {
      this.filterByUserTokens = this.$store.getters[`management/paginationEnabled`](EXT.TOKEN);

      if (this.filterByUserTokens && selfUser?.status?.userID) {
        // Only get associated with the current user
        const opt = { // Of type ActionFindPageArgs
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createSingleField({
              field: 'metadata.fields.1',
              value: selfUser.status?.userID,
            })
          })
        };

        hashedRequests.steveTokens = this.$store.dispatch(`management/findPage`, { type: EXT.TOKEN, opt });
      } else {
        hashedRequests.steveTokens = this.$store.dispatch('management/findAll', { type: EXT.TOKEN });
      }
    }

    if (selfUser?.canGetUser && selfUser.status?.userID) {
      // Fetch the user info for ChangePassword (ChangePasswordDialog needs the user info for the user whose password is being changed)
      hashedRequests.user = this.$store.dispatch('management/find', {
        type: MANAGEMENT.USER,
        id:   selfUser.status?.userID
      });
    }

    // Get all settings - the API host setting may not be set, so this avoids a 404 request if we look for the specific setting
    hashedRequests.allSettings = this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });

    const {
      normanTokens, steveTokens, allSettings, user
    } = await allHash(hashedRequests);

    this.normanTokens = normanTokens;
    this.steveTokens = steveTokens;
    this.user = user;

    const apiHostSetting = allSettings.find((i) => i.id === SETTING.API_HOST);
    const serverUrlSetting = allSettings.find((i) => i.id === SETTING.SERVER_URL);

    this.apiHostSetting = apiHostSetting?.value;
    this.serverUrlSetting = serverUrlSetting?.value;
  },
  data() {
    return {
      normanTokenSchema: undefined,
      steveTokenSchema:  undefined,
      apiHostSetting:    null,
      serverUrlSetting:  null,
      rows:              null,
      canChangePassword: false,
      user:              null,
      normanTokens:      null,
      steveTokens:       null,
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    apiKeyheaders() {
      return [
        EXPIRY_STATE,
        ACCESS_KEY,
        DESCRIPTION,
        SCOPE_NORMAN,
        NORMAN_KEY_DEPRECATION,
        LAST_USED,
        EXPIRES,
        AGE_NORMAN
      ];
    },

    principal() {
      const principalId = this.$store.getters['auth/principalId'];
      const principal = this.$store.getters['rancher/byId'](NORMAN.PRINCIPAL, principalId);

      if (!principal) {
        console.error('Failed to find principal with id: ', principalId); // eslint-disable-line no-console
      }

      return principal || {};
    },

    filteredNormanTokens() {
      // Filter out tokens that are not API Keys and are not expired UI Sessions
      const isApiKey = (key) => {
        const labels = key.labels;
        const expired = key.expired;
        const current = key.current;

        return ( !expired || !labels || !labels['ui-session'] ) && !current;
      };

      return !this.normanTokens ? [] : this.normanTokens.filter(isApiKey);
    },

    filteredNewTokens() {
      // Filter out tokens that are not API Keys and are not expired UI Sessions
      const isApiKey = (key) => {
        const labels = key.metadata?.labels;
        const expired = key.status?.expired;
        const current = key.status?.current;

        return ( !expired || !labels || !labels['ui-session'] ) && !current;
      };

      return !this.steveTokens ? [] : this.steveTokens.filter(isApiKey);
    },

    apiKeys() {
      return (this.filteredNormanTokens || []).concat(this.filteredNewTokens || []);
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

      const passwordChangeRequest = await this.$store.dispatch('management/create', { type: EXT.PASSWORD_CHANGE_REQUESTS });

      return !!passwordChangeRequest?.canChangePassword;
    },
    showChangePasswordDialog() {
      this.$store.dispatch('management/promptModal', {
        component:      'ChangePasswordDialog',
        componentProps: { user: this.user },
        testId:         'change-password__modal',
        customClass:    'change-password-modal',
        modalWidth:     '500',
        height:         '465'
      });
    }
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
          @click="showChangePasswordDialog"
        >
          {{ t("accountAndKeys.account.change") }}
        </button>
      </div>
    </div>

    <hr role="none">
    <div class="keys-header">
      <div>
        <h2 v-t="'accountAndKeys.apiKeys.title'" />
      </div>
      <button
        v-if="steveTokenSchema"
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
      v-if="steveTokenSchema"
      class="keys"
    >
      <Banner
        v-if="filteredNormanTokens.length"
        color="warning"
        class="mb-20"
        :label="t('accountAndKeys.apiKeys.normanTokenDeprecation')"
      />
      <ResourceTable
        :schema="steveTokenSchema"
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
