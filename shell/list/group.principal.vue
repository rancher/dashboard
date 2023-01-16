<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import Masthead from '@shell/components/ResourceList/Masthead';
import { NORMAN, MANAGEMENT } from '@shell/config/types';
import AsyncButton from '@shell/components/AsyncButton';
import { applyProducts } from '@shell/store/type-map';
import { NAME } from '@shell/config/product/auth';
import { MODE, _EDIT } from '@shell/config/query-params';
import { mapState } from 'vuex';
import { BLANK_CLUSTER } from '@shell/store';
import { allHash } from '@shell/utils/promise';

export default {
  components: {
    AsyncButton, ResourceTable, Masthead, Loading
  },
  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    await this.updateRows();

    const authConfigSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.AUTH_CONFIG);
    const grbSchema = this.$store.getters['rancher/schemaFor'](NORMAN.GLOBAL_ROLE_BINDING);

    const hash = await allHash({
      user:      this.$store.dispatch('rancher/request', { url: '/v3/users?limit=0' }),
      providers: authConfigSchema ? this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.AUTH_CONFIG }) : Promise.resolve([])
    });

    const nonLocalAuthProvider = !!hash.providers.find(p => p.name !== 'local' && p.enabled === true);

    this.canRefreshAccess = nonLocalAuthProvider && !!hash.user?.actions?.refreshauthprovideraccess;
    this.canCreateGlobalRoleBinding = nonLocalAuthProvider && grbSchema?.collectionMethods?.includes('POST');
  },
  data() {
    return {
      rows:                       [],
      canCreateGlobalRoleBinding: false,
      canRefreshAccess:           false,
      assignLocation:             {
        path:  `/c/${ BLANK_CLUSTER }/${ NAME }/${ NORMAN.SPOOFED.GROUP_PRINCIPAL }/assign-edit`,
        query: { [MODE]: _EDIT }
      },
      initialLoad: true,
    };
  },
  computed: { ...mapState('action-menu', ['showPromptRemove', 'toRemove']) },
  watch:    {
    async toRemove(resources) {
      if (this.initialLoad) {
        this.initialLoad = false;

        return;
      }
      if (resources?.length === 0) {
        await this.refreshGroupMemberships(() => {});
        // spoofed collections normally get updated when promptRemove has completed (given the resources are of a spoofed type)..
        // ... however in this use case it doesn't happen so do it manually (the removed resources are not globalRoleBindings and not spoofed)
        await this.updateRows(true);
      }
    }
  },
  methods: {
    async updateRows(force = false) {
      await this.updateGroupPrincipals(force);

      // Upfront load all global roles, this makes it easier to sync fetch them later on
      await this.$store.dispatch('management/findAll', { type: MANAGEMENT.GLOBAL_ROLE });

      await this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL, opt: { url: '/v3/principals' } });
    },
    async refreshGroupMemberships(buttonDone) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:    '/v3/users?action=refreshauthprovideraccess',
          method: 'post',
          data:   { },
        });

        await this.updateGroupPrincipals(true);

        buttonDone(true);
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: 'Error refreshing group memberships', err }, { root: true });
        buttonDone(false);
      }
    },
    async updateGroupPrincipals(force = false) {
      // This is needed in SSR, but not SPA. If this is not here... when cluster/findAll is dispatched... we fail to find the spoofed
      // type's `getInstance` fn as it hasn't been registered (`instanceMethods` in type-map file is empty)
      await applyProducts(this.$store);

      // Force spoofed type getInstances to execute again
      this.rows = await this.$store.dispatch('management/findAll', {
        type: NORMAN.SPOOFED.GROUP_PRINCIPAL,
        opt:  { force }
      }, { root: true });
    }
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
          :class="{'mr-5': canCreateGlobalRoleBinding}"
          @click="refreshGroupMemberships"
        />
        <n-link
          v-if="canCreateGlobalRoleBinding"
          :to="assignLocation"
          class="btn role-primary"
        >
          {{ t("authGroups.actions.assignRoles") }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable
      :schema="schema"
      :rows="rows"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    />
  </div>
</template>
