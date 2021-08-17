<script>
import { MANAGEMENT, NORMAN, VIRTUAL_TYPES } from '@/config/types';
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { NAME } from '@/config/product/explorer';
import Masthead from '@/components/ResourceList/Masthead';
import { AGE, ROLE, STATE, PRINCIPAL } from '@/config/table-headers';
import { canViewClusterPermissionsEditor } from '@/components/form/Members/ClusterPermissionsEditor.vue';

/**
 * When this metadata.name is used it indicates that the binding was created by the cluster owner.
 * It's used to preventing filtering out the Default Admin user when filtering out system users.
 */
const CREATOR_CLUSTER_OWNER = 'creator-cluster-owner';

export default {
  components: {
    Loading, Masthead, ResourceTable
  },

  async fetch() {
    const clusterRoleTemplateBindingSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING);

    const hydration = [
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }),
      this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
    ];
    const clusterRoleTemplateBindings = clusterRoleTemplateBindingSchema ? await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }) : [];

    await Promise.all(hydration);
    this.$set(this, 'clusterRoleTemplateBindings', clusterRoleTemplateBindings);
  },

  data() {
    return {
      schema:         this.$store.getters[`management/schemaFor`](MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING),
      headers:        [
        STATE,
        PRINCIPAL,
        ROLE,
        AGE
      ],
      createLocation: {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  NAME,
          resource: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
        }
      },
      resource:                    MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      clusterRoleTemplateBindings: [],
      VIRTUAL_TYPES
    };
  },

  computed: {
    filteredClusterRoleTemplateBindings() {
      return this.clusterRoleTemplateBindings
        .filter(b => (!b.isSystem || b.metadata.name === CREATOR_CLUSTER_OWNER ) && b.clusterName === this.$store.getters['currentCluster'].id);
    },

    canManageMembers() {
      return canViewClusterPermissionsEditor(this.$store);
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
      :favorite-resource="VIRTUAL_TYPES.CLUSTER_MEMBERS"
      :is-creatable="canManageMembers"
      :create-location="createLocation"
      :create-button-label="t('members.createActionLabel')"
    />
    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="filteredClusterRoleTemplateBindings"
      :groupable="false"
      :namespaced="false"
      sub-search="subSearch"
      :sub-fields="['nameDisplay']"
    />
  </div>
</template>
