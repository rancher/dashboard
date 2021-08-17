<script>
import { MANAGEMENT } from '@/config/types';
import { _CREATE, _VIEW } from '@/config/query-params';
import MembershipEditor from '@/components/form/Members/MembershipEditor';
import { canViewMembershipEditor } from '@/components/form/Members/MembershipEditor.vue';

export function canViewClusterMembershipEditor(store) {
  return canViewMembershipEditor(store);
}

export default {
  components: { MembershipEditor },

  props: {
    parentId: {
      type:    String,
      default: null
    },

    mode: {
      type:     String,
      required: true
    }
  },

  data() {
    return {
      MANAGEMENT, bindings: [], lastSavedBindings: []
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    isView() {
      return this.mode === _VIEW;
    }
  },
  methods: {
    defaultBindingHandler() {
      return this.$store.dispatch(`management/create`, {
        type:                  MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
        roleTemplateName:      'cluster-owner',
        principalName:         this.$store.getters['auth/principalId'],
      });
    }
  }
};
</script>
<template>
  <MembershipEditor
    v-bind="$attrs"
    add-member-dialog-name="AddClusterMemberDialog"
    :default-binding-handler="defaultBindingHandler"
    :type="MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING"
    :mode="mode"
    parent-key="clusterName"
    :parent-id="parentId"
    v-on="$listeners"
  />
</template>
