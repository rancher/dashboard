<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';

export default {
  name:       'EditManagedChart',
  components: { CruResource },
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

    currentComponent() {
      const name = this.value.metadata.name;

      return require(`./${ name }.vue`).default;
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
    <component
      :is="currentComponent"
      :value="value"
    />
  </CruResource>
</template>
