<script>
import AsyncButton from '@shell/components/AsyncButton';
import { NORMAN } from '@shell/config/types';
import { NAME } from '@shell/config/product/auth';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  components: {
    AsyncButton,
    ResourceTable,
    Masthead
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
    const store = this.$store;

    await store.dispatch(`rancher/findAll`, { type: NORMAN.USER });

    await this.$fetchType(this.resource);

    this.canRefreshAccess = await this.$store.dispatch('rancher/request', { url: '/v3/users?limit=0' })
      .then(res => !!res?.actions?.refreshauthprovideraccess);
  },

  data() {
    const getters = this.$store.getters;

    const schema = getters[`management/schemaFor`](this.resource);

    return {
      schema,
      canRefreshAccess: false,
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
      const requiredUsers = params.product === NAME ? this.rows.filter(a => !a.isSystem) : this.rows;

      requiredUsers.forEach((r) => {
        r.canRefreshAccess = this.canRefreshAccess;
      });

      return requiredUsers;
    }

  },

  methods: {
    async refreshGroupMemberships(buttonDone) {
      try {
        await this.$store.dispatch('rancher/collectionAction', {
          type:       NORMAN.USER,
          actionName: 'refreshauthprovideraccess',
        });

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
      <template slot="extraActions">
        <AsyncButton
          v-if="canRefreshAccess"
          mode="refresh"
          :action-label="t('authGroups.actions.refresh')"
          :waiting-label="t('authGroups.actions.refresh')"
          :success-label="t('authGroups.actions.refresh')"
          :error-label="t('authGroups.actions.refresh')"
          @click="refreshGroupMemberships"
        />
      </template>
    </Masthead>

    <ResourceTable
      :schema="schema"
      :rows="users"
      :group-by="groupBy"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>

<style lang="scss">
</style>
