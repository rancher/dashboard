<script>
import { NORMAN } from '@shell/config/types';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import MembershipEditor, { canViewMembershipEditor, canViewMembershipEditorList } from '@shell/components/form/Members/MembershipEditor';

export function canViewProjectMembershipEditor(store) {
  return canViewMembershipEditor(store, true);
}

// SURE-8995: read-only view gate for the project members list (see
// `canViewMembershipEditorList`). Used to show the Members tab to users who can
// see project members but not fully manage them (e.g. a cluster-owner on a
// `user-base` global role).
export function canViewProjectMembershipList(store) {
  return canViewMembershipEditorList(store, true);
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
    :modal-sticky="true"
    :default-binding-handler="defaultBindingHandler"
    :type="NORMAN.PROJECT_ROLE_TEMPLATE_BINDING"
    :mode="mode"
    parent-key="projectId"
    :parent-id="parentId"
  />
</template>
