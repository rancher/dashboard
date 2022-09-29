<script>
import { MANAGEMENT, NORMAN, VIRTUAL_TYPES } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { AGE, ROLE, STATE, PRINCIPAL } from '@shell/config/table-headers';
import { canViewClusterPermissionsEditor } from '@shell/components/form/Members/ClusterPermissionsEditor.vue';
import Banner from '@components/Banner/Banner.vue';
import { mapGetters } from 'vuex';

/**
 * Explorer members page.
 * Route: /c/local/explorer/members
 */
export default {
  name: 'ExplorerMembers',

  components: {
    Banner,
    Masthead,
    ResourceTable
  },

  props: {
    // Cluster tole template binding create route - defaults to the explorer route
    createLocationOverride: {
      type:    Object,
      default: () => {
        return {
          name:   'c-cluster-product-resource-create',
          params: { resource: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }
        };
      }
    }
  },

  async fetch() {
    const clusterRoleTemplateBindingSchema = this.$store.getters[
      `rancher/schemaFor`
    ](NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING);

    const hydration = [
      clusterRoleTemplateBindingSchema ? this.$store.dispatch(
        `rancher/findAll`,
        { type: NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING },
        { root: true }
      ) : [],
      clusterRoleTemplateBindingSchema ? this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }) : [],
      this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE })
    ];
    const [clusterRoleTemplateBindings] = await Promise.all(hydration);
    const steveBindings = await Promise.all(
      clusterRoleTemplateBindings.map(b => b.steve)
    );

    this.$set(this, 'clusterRoleTemplateBindings', steveBindings);
  },

  data() {
    return {
      schema: this.$store.getters[`management/schemaFor`](
        MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING
      ),
      headers:        [STATE, PRINCIPAL, ROLE, AGE],
      createLocation: {
        ...this.createLocationOverride,
        params: {
          ...this.createLocationOverride.params,
          cluster: this.$store.getters['currentCluster'].id
        }
      },
      resource:                    MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      clusterRoleTemplateBindings: [],
      VIRTUAL_TYPES
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    filteredClusterRoleTemplateBindings() {
      return this.clusterRoleTemplateBindings.filter(
        b => b.clusterName === this.$store.getters['currentCluster'].id
      );
    },
    canManageMembers() {
      return canViewClusterPermissionsEditor(this.$store);
    },
    isLocal() {
      return this.$store.getters['currentCluster'].isLocal;
    }
  }
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :favorite-resource="VIRTUAL_TYPES.CLUSTER_MEMBERS"
      :create-location="createLocation"
      :create-button-label="t('members.createActionLabel')"
    />
    <Banner
      v-if="isLocal"
      color="error"
      :label="t('members.localClusterWarning')"
    />
    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="filteredClusterRoleTemplateBindings"
      :groupable="false"
      :namespaced="false"
      :loading="$fetchState.pending || !currentCluster"
      sub-search="subSearch"
      :sub-fields="['nameDisplay']"
    />
  </div>
</template>
