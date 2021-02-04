<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Masthead from '@/components/ResourceList/Masthead';
import { NORMAN } from '@/config/types';
import AsyncButton from '@/components/AsyncButton';
import { applyProducts } from '@/store/type-map';
import { NAME } from '@/config/product/auth';
import { MODE, _EDIT } from '@/config/query-params';

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
  },
  async fetch() {
    this.rows = await this.$store.dispatch('cluster/findAll', { type: NORMAN.SPOOFED.GROUP_PRINCIPAL }, { root: true }); // See PromptRemove.vue

    const principals = await this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL, opt: { url: '/v3/principals' } });

    this.hasGroups = principals.filter(principal => principal.principalType === 'group')?.length;

    const userSchema = this.$store.getters[`rancher/schemaFor`](NORMAN.USER);

    this.canRefresh = !!userSchema.collectionActions?.refreshauthprovideraccess;
  },
  data() {
    return {
      rows:           null,
      hasGroups:      false,
      canRefresh:     false,
      assignLocation:  {
        path:   `/c/local/${ NAME }/${ NORMAN.SPOOFED.GROUP_PRINCIPAL }/assign-edit`,
        query: { [MODE]: _EDIT }
      }
    };
  },
  methods: {
    async refreshGroupMemberships(buttonDone) {
      try {
        await this.$store.dispatch('rancher/request', {
          url:           '/v3/users?action=refreshauthprovideraccess',
          method:        'post',
          data:          { },
        });

        // This is needed in SSR, but not SPA. If this is not here... when cluster/findAll is dispatched... we fail to find the spoofed
        // type's `getInstance` fn as it hasn't been registered (`instanceMethods` in type-map file is empty)
        await applyProducts(this.$store);

        this.rows = await this.$store.dispatch('cluster/findAll', {
          type: NORMAN.SPOOFED.GROUP_PRINCIPAL,
          opt:  { force: true }
        }, { root: true });

        buttonDone(true);
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: 'Error refreshing group memberships', err }, { root: true });
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
          v-if="canRefresh"
          mode="refresh"
          :action-label="t('authGroups.actions.refresh')"
          :waiting-label="t('authGroups.actions.refresh')"
          :success-label="t('authGroups.actions.refresh')"
          :error-label="t('authGroups.actions.refresh')"
          @click="refreshGroupMemberships"
        />
        <n-link
          v-if="hasGroups"
          :to="assignLocation"
          class="btn role-primary"
        >
          {{ t("authGroups.actions.assignRoles") }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable :schema="schema" :rows="rows" />
  </div>
</template>
