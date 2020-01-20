<script>
import ResourceTable from '@/components/ResourceTable';
import { FRIENDLY } from '@/config/friendly';
import { RBAC } from '@/config/types';
import TabbedLinks from '@/components/TabbedLinks';

/**
 * RBAC Global Roles Index Table view 
   @displayName RBAC Global Role Index
 */
export default {
  name: 'RBACGlobalIndex',

  components: {
    ResourceTable,
    TabbedLinks
  },

  props: {
    /**
     * Global roles
     * @model
     */
    globalRows: {
      type:     Array,
      required: true,
      default:  () => []
    },
    /**
     * Tab list passed from parent route
     */
    tabList: {
      type:     Array,
      required: true,
      default:  () => []
    },
    /**
     * Route to create
     */
    createPath: {
      type:    Object,
      default: () => ({ name: 'rbac-resource-create', params: { resource: RBAC.ROLES } })
    }
  },

  computed:   {
    /**
     * Returns first rows availableActions, assumes all rows have same actions
     */
    actions() {
      return this.rows[0].availableActions;
    },
    /**
     * Returns RBAC Cluster Role Schmea
     */
    globalSchema() {
      return this.$store.getters['cluster/schemaFor'](RBAC.ROLES);
    },
    /**
     * Returns RBAC Cluster Role Headers
     */
    headers() {
      return FRIENDLY[RBAC.ROLES].headers;
    },
  },
};
</script>
<template>
  <div>
    <header>
      <h1>
        Roles - Global
      </h1>
      <div class="actions">
        <nuxt-link
          append
          class="btn bg-primary"
          tag="button"
          :to="createPath"
          type="button"
        >
          Create
        </nuxt-link>
      </div>
    </header>
    <TabbedLinks :tab-list="tabList">
      <ResourceTable :rows="globalRows" :schema="globalSchema" :headers="headers" />
    </TabbedLinks>
  </div>
</template>
