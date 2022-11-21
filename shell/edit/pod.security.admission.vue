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
      :closable="true"
    >
      PSPs are going away in 1.25. PSAs are the new thing. As I understand it they are a lot simpler than PSPSs. If you look at that document, for namespaces, you can add a label that configures the mode for the pods in a given namespace, so I imagine we'll want to add that to the detail view for a namespace and also the edit view.
      You can also declare exemptions for pods, so that will require a change to the pods detail/edit screens.
      I don't know if there is a log from the admission controller that we could show to help users understand what pods were blocked by the configuration.
      Rancher does not officially support k8s 1.25, so one task is to bring up a 1.25 cluster and import it into Rancher - we'll need that for dev/testing.
    </Banner>
    <Banner
      icon="icon-pod_security"
      color="error"
      :closable="true"
    >
      PSPs are going away in 1.25. PSAs are the new thing. As I understand it they are a lot simpler than PSPSs.
    </Banner>
    <Banner color="info">
      PSPs are going away in 1.25.
    </Banner>
    <PodSecurityAdmission
      :value="value"
      :mode="mode"
      :has-exceptions="true"
    />
  </CruResource>
</template>
