<script>
import { NORMAN } from '@shell/config/types';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import MembershipEditor from '@shell/components/form/Members/MembershipEditor';
import { canViewMembershipEditor } from '@shell/components/form/Members/MembershipEditor.vue';

export function canViewProjectMembershipEditor(store) {
  return canViewMembershipEditor(store, true);
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
      return this.$store.dispatch(`management/create`, {
        type:            NORMAN.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateId:  'project-owner',
        userPrincipalId: this.$store.getters['auth/principalId'],
      });
    }
  }
};
</script>
<template>
  <MembershipEditor
    ref="editor"
    add-member-dialog-name="AddProjectMemberDialog"
    :default-binding-handler="defaultBindingHandler"
    :type="NORMAN.PROJECT_ROLE_TEMPLATE_BINDING"
    :mode="mode"
    parent-key="projectId"
    :parent-id="parentId"
    v-on="$listeners"
  />
</template>
