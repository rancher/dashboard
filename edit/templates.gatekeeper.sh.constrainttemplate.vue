<script>
import ResourceYaml from '@/components/ResourceYaml';
import CreateEditView from '@/mixins/create-edit-view';

export default {
  isYamlEditor:     true,
  components:   { ResourceYaml },
  mixins:       [CreateEditView],
  props:        {
    model: {
      type:    Object,
      default: null,
    },
    yaml: {
      type:    String,
      default: null,
    },
    obj: {
      type:    Object,
      default: null
    }
  },
  methods: {
    doneOverride() {
      this.$router.replace({
        name:   'c-cluster-gatekeeper-templates',
        params: this.$route.params
      });
    }
  }
};

</script>

<template>
  <div>
    <ResourceYaml
      :obj="obj"
      :value="yaml"
      :done-route="doneRoute"
      :parent-route="doneRoute"
      :parent-params="doneParams"
      :done-override="doneOverride"
      :for-create="mode === 'create'"
      :show-header="false"
    />
  </div>
</template>
