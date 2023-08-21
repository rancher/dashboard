<script>

import ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Banner } from '@components/Banner';
export default {
  components: { ClusterMembershipEditor, Banner },
  mixins:     [CreateEditView],
  props:      {
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
  }
};
</script>
<template>
  <div>
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
  </div>
</template>
