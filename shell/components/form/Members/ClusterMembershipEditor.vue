<script>
import { NORMAN } from '@shell/config/types';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import MembershipEditor, { canViewMembershipEditor } from '@shell/components/form/Members/MembershipEditor';

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
      NORMAN, bindings: [], lastSavedBindings: []
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
      return this.$store.dispatch(`rancher/create`, {
        type:            NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING,
        roleTemplateId:  'cluster-owner',
        userPrincipalId: this.$store.getters['auth/principalId']
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
    :type="NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING"
    :mode="mode"
    parent-key="clusterId"
    :parent-id="parentId"
  />
</template>
