<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import PodSecurityAdmission from '@shell/components/PodSecurityAdmission';
import Banner from '@components/Banner/Banner.vue';

export default {
  mixins:     [CreateEditView],
  components: {
    CruResource,
    PodSecurityAdmission,
    Banner
  },
  data() {
    return {};
  },
  props: {
    value: {
      type:     Object,
      required: true,
      default:  () => {}
    },
    mode: {
      type:     String,
      required: true,
    }
  },
  computed: {},
  created() {}
};
</script>

<template>
  <CruResource
    :can-yaml="!isCreate"
    :mode="mode"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done()"
  >
    <Banner
      icon="icon-pod_security"
      color="error"
    >
      PSA error message
    </Banner>
    <PodSecurityAdmission
      :value="value"
      :mode="mode"
      :has-exceptions="true"
    />
  </CruResource>
</template>
