<script>
import { MANAGEMENT, NORMAN, VIRTUAL_TYPES } from '@/config/types';
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Masthead from '@/components/ResourceList/Masthead';
import { AGE, ROLE, STATE, PRINCIPAL } from '@/config/table-headers';
import { canViewClusterPermissionsEditor } from '@/components/form/Members/ClusterPermissionsEditor.vue';

/**
 * Explorer members page.
 * Route: /c/local/explorer/members
 */
export default {

  name: 'ExplorerMembers',

  components: {
    Loading, Masthead, ResourceTable
  },

  async fetch() {
    const clusterRoleTemplateBindingSchema = this.$store.getters[`rancher/schemaFor`](NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING);

    const hydration = [
      clusterRoleTemplateBindingSchema ? this.$store.dispatch(`rancher/findAll`, { type: NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING }, { root: true }) : [],
      clusterRoleTemplateBindingSchema ? this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }) : [],
      this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }),
    ];
    const [clusterRoleTemplateBindings] = await Promise.all(hydration);
    const steveBindings = await Promise.all(clusterRoleTemplateBindings.map(b => b.steve));

    this.$set(this, 'clusterRoleTemplateBindings', steveBindings);
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
          product:  this.$store.getters['currentProduct'].name,
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
        .filter(b => b.clusterName === this.$store.getters['currentCluster'].id);
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
