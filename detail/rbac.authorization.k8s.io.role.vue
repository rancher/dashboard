<script>
import createEditView from '@/mixins/create-edit-view';
import DetailTop from '@/components/DetailTop';
import VStack from '@/components/Layout/Stack/VStack';
import TableRbacRules from '@/components/TableRbacRules';
import { DESCRIPTION } from '@/config/labels-annotations';
import ResourceTabs from '@/components/form/ResourceTabs';

/**
 * Detail view for RBAC Role
   @displayName RBAC Role Detail
 */
export default {
  name: 'DetailRole',

  components: {
    DetailTop,
    TableRbacRules,
    VStack,
    ResourceTabs
  },

  mixins:     [createEditView],

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

  computed: {
    /**
     * Returns description from annotations
     */
    description() {
      const { metadata:{ annotations = {} } } = this.value;

      return annotations[DESCRIPTION];
    },

    /**
     * Returns columns for the detail top
     */
    detailTopColumns() {
      const columns = [
        {
          title:   'Locked',
          name:    'locked',
          content: true
        },
        {
          title:   'New User Default',
          name:    'newuserdefault',
          content: true // TODO doesn't exist yet
        },
        {
          title:   'Type',
          content: this.typeDisplay
        },
        {
          title:   'Description',
          content: this.description
        },
      ];

      return columns;
    },
  },
};
</script>

<template>
  <VStack class="rbac-role-detail">
    <DetailTop :columns="detailTopColumns">
      <template v-slot:locked>
        <span>
          <span v-if="true">
            <span>
              <i class="icon icon-lg icon-checkmark" />
            </span>
          </span>
          <span v-else>
            <span>
              <i class="icon icon-lg icon-x" />
            </span>
          </span>
        </span>
      </template>
      <template v-slot:newuserdefault>
        <span>
          <span v-if="true">
            <span>
              <i class="icon icon-lg icon-checkmark" />
            </span>
          </span>
          <span v-else>
            <span>
              <i class="icon icon-lg icon-x" />
            </span>
          </span>
        </span>
      </template>
    </DetailTop>

    <div class="spacer"></div>

    <div class="row mt-50">
      <TableRbacRules :role="value" />
    </div>
    <ResourceTabs v-model="value" />
  </VStack>
</template>
