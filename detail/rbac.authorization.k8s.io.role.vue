<script>
import createEditView from '@/mixins/create-edit-view';
import VStack from '@/components/Layout/Stack/VStack';
import TableRbacRules from '@/components/TableRbacRules';
import ResourceTabs from '@/components/form/ResourceTabs';

/**
 * Detail view for RBAC Role
   @displayName RBAC Role Detail
 */
export default {
  name: 'DetailRole',

  components: {
    TableRbacRules,
    VStack,
    ResourceTabs
  },

  mixins: [createEditView],

  props: {
    /**
     * The cluster role
     * @model
     */
    value: {
      type:     Object,
      required: true,
    },
  },
};
</script>

<template>
  <VStack class="rbac-role-detail">
    <div class="spacer"></div>

    <div class="row mt-50">
      <TableRbacRules :role="value" />
    </div>
    <ResourceTabs v-model="value" :mode="mode" />
  </VStack>
</template>
