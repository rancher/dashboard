<script>
import { RIO } from '@/config/types';
import ResourceYaml from '@/components/ResourceYaml';
import CreateEditView from '@/mixins/create-edit-view';
import CruService from '@/components/cru/rio.cattle.io.v1.service';
import { EDIT_YAML, _FLAGGED, EDIT_CONTAINER } from '@/config/query-params';

export default {
  components: { ResourceYaml, CruService },
  mixins:     [CreateEditView],

  computed: {
    doneRoute() {
      const name = this.$route.name.replace(/(-namespace)?-id$/, '');

      return name;
    },

    doneParams() {
      return this.$route.params;
    },

    typeDisplay() {
      return 'Service';
    },
  },

  async asyncData({ store, params, route }) {
    const { namespace, id } = params;
    const fqid = `${ namespace }/${ id }`;

    // const schema = store.getters['cluster/schemaFor'](RIO.SERVICE);
    const obj = await store.dispatch('cluster/find', { type: RIO.SERVICE, id: fqid });
    const yaml = await obj.followLink('view', { headers: { accept: 'application/yaml' } });

    const containerName = route.query[EDIT_CONTAINER];
    const pickContainer = !!(obj.spec.sidecars && obj.spec.sidecars.length) && !containerName;

    const model = await store.dispatch('cluster/clone', obj);

    return {
      model,
      containerName,
      pickContainer,
      yaml:   yaml.data,
      asYaml: route.query[EDIT_YAML] === _FLAGGED,
    };
  }
};
</script>

<template>
  <div>
    <ResourceYaml v-if="asYaml" :obj="model" :value="yaml" :done-route="doneRoute" />
    <div v-else-if="pickContainer">
      Pick a container...
    </div>
    <div v-else>
      <CruService
        v-model="model"
        :done-route="doneRoute"
        :done-params="doneParams"
        :namespace-suffix-on-create="true"
        type-label="Service"
        :mode="mode"
      />
    </div>
  </div>
</template>

};
</script>
