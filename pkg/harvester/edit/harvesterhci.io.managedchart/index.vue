<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import RancherMonitoring from './rancher-monitoring';

export default {
  name:       'EditManagedChart',
  components: { CruResource, RancherMonitoring },
  mixins:     [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    doneLocationOverride() {
      return this.value.doneOverride;
    },
  },
};
</script>

<template>
  <CruResource
    class="route"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :done-route="doneRoute"
    :show-cancel="false"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <RancherMonitoring
      :value="value"
    />
  </CruResource>
</template>
