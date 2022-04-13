<script>
import AsyncButton from '@shell/components/AsyncButton';
import { NORMAN } from '@shell/config/types';
import { NAME } from '@shell/config/product/auth';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';

export default {
  components: {
    AsyncButton,
    Loading,
    ResourceTable,
    Masthead
  },

  async fetch() {
    const store = this.$store;
    const resource = this.resource;

    await store.dispatch(`rancher/findAll`, { type: NORMAN.USER });

    this.allUsers = await store.dispatch(`management/findAll`, { type: resource });

    this.canRefreshAccess = await this.$store.dispatch('rancher/request', { url: '/v3/users?limit=0' })
      .then(res => !!res?.actions?.refreshauthprovideraccess);
  },

  data() {
    const getters = this.$store.getters;
    const params = { ...this.$route.params };

    const resource = params.resource;

    const schema = getters[`management/schemaFor`](resource);

    return {
      schema,
      resource,

      // Provided by fetch later
      rows:             null,
      canRefreshAccess: false,

      allUsers: null,
    };
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema);
    },

    users() {
      if ( !this.allUsers ) {
        return [];
      }

      // Update the list of users
      // 1) Only show system users in explorer/users and not in auth/users
      // 2) Supplement user with info to enable/disable the refresh group membership action (this is not persisted on save)
      const params = { ...this.$route.params };
      const requiredUsers = params.product === NAME ? this.allUsers.filter(a => !a.isSystem) : this.allUsers;

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
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
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

    <ResourceTable :schema="schema" :rows="users" :group-by="groupBy" />
  </div>
</template>

<style lang="scss">
</style>
