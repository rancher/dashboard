<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';

export default {
  name: 'EditAddon',

  components: { CruResource },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    currentComponent() {
      const name = this.value.metadata.name;

      return require(`./${ name }.vue`).default;
    },
  },
};
</script>

<template>
  <CruResource
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
  >
    <component
      :is="currentComponent"
      :value="value"
      :mode="mode"
    />
  </CruResource>
</template>
