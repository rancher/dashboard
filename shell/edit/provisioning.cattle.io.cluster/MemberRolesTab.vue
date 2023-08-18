<script>

import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Banner } from '@components/Banner';
import Tab from '@shell/components/Tabbed/Tab';
export default {
  components: {
    ClusterMembershipEditor, Banner, Tab
  },
  mixins: [CreateEditView],
  props:  {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
    onMembershipUpdate: {
      type:     Function,
      required: true
    }
  },
  computed: {
    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },
  }
};
</script>
<template>
  <Tab
    v-if="canManageMembers"
    name="memberRoles"
    label-key="cluster.tabs.memberRoles"
    :weight="10"
  >
    <Banner
      v-if="isEdit"
      color="info"
    >
      {{ t('cluster.memberRoles.removeMessage') }}
    </Banner>
    <ClusterMembershipEditor
      :mode="mode"
      :parent-id="value.mgmt ? value.mgmt.id : null"
      @membership-update="onMembershipUpdate"
    />
  </Tab>
</template>
