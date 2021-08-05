<script>
import { MANAGEMENT } from '@/config/types';
import { _CREATE, _VIEW } from '@/config/query-params';
import MembershipEditor from '@/components/form/Members/MembershipEditor';

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
        type:                  MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateName:      'project-owner',
        principalName:         this.$store.getters['auth/principalId'],
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
    :type="MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING"
    :mode="mode"
    parent-key="projectName"
    :parent-id="parentId"
    v-on="$listeners"
  />
</template>
