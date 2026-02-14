<script>
import AsyncButton from '@shell/components/AsyncButton';
import { EXT } from '@shell/config/types';
import { NAME } from '@shell/config/product/auth';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { isAdminUser } from '@shell/store/type-map';
import TableDataUserIcon from '@shell/components/TableDataUserIcon';

export default {
  components: {
    AsyncButton,
    ResourceTable,
    Masthead,
    TableDataUserIcon,
  },
  mixins: [ResourceFetch],
  props:  {
    resource: {
      type:     String,
      required: true,
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    await this.$fetchType(this.resource);

    this.membershipRefreshRequests = await this.$store.dispatch('management/create', { type: EXT.GROUP_MEMBERSHIP_REFRESH_REQUESTS });
    this.canRefreshMemberships = !!this.membershipRefreshRequests?.canRefreshMemberships;
  },

  data() {
    const getters = this.$store.getters;

    const schema = getters[`management/schemaFor`](this.resource);

    return {
      schema,
      membershipRefreshRequests: undefined,
      canRefreshMemberships:     false
    };
  },

  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema);
    },

    users() {
      if ( !this.rows ) {
        return [];
      }

      // Update the list of users
      // 1) Only show system users in explorer/users and not in auth/users
      // 2) Supplement user with info to enable/disable the refresh group membership action (this is not persisted on save)
      const params = { ...this.$route.params };
      const requiredUsers = params.product === NAME ? this.rows.filter((a) => !a.isSystem) : this.rows;

      requiredUsers.forEach((r) => {
        r.canRefreshMemberships = this.canRefreshMemberships;
      });

      return requiredUsers;
    },

    isAdmin() {
      return isAdminUser(this.$store.getters);
    }
  },

  methods: {
    async refreshGroupMemberships(buttonDone) {
      try {
        // userId specifies the user ID. Use '*' for all users. Check the schemaDefinition for more details.
        this.membershipRefreshRequests.spec = { userId: '*' };
        await this.membershipRefreshRequests.save();
        buttonDone(true);
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: this.t('user.list.errorRefreshingGroupMemberships'), err }, { root: true });
        buttonDone(false);
      }
    },
  },
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
    >
      <template #extraActions>
        <AsyncButton
          v-if="canRefreshMemberships"
          mode="refresh"
          :action-label="t('authGroups.actions.refresh')"
          :waiting-label="t('authGroups.actions.refresh')"
          :success-label="t('authGroups.actions.refresh')"
          :error-label="t('authGroups.actions.refresh')"
          @click="refreshGroupMemberships"
        />
      </template>
      <template
        v-if="isAdmin"
        #subHeader
      >
        <router-link
          :to="{ name: 'c-cluster-auth-user.retention'}"
          class="btn role-link btn-sm btn-user-retention"
          data-testid="router-link-user-retention"
        >
          <i class="icon icon-gear" />
          {{ t('user.retention.button.label') }}
        </router-link>
      </template>
    </Masthead>

    <ResourceTable
      :schema="schema"
      :rows="users"
      :group-by="groupBy"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    >
      <template #col:user-state="{row}">
        <td>
          <TableDataUserIcon
            :user-state="row.stateDisplay"
            :is-active="row.state === 'active'"
          />
        </td>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss">
  .btn-user-retention {
    display: flex;
    gap: 0.25rem;
    padding: 0;
  }
</style>
