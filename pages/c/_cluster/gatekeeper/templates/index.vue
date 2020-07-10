<script>
import { GATEKEEPER } from '@/config/types';
import { AGE, NAME, STATE } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import Masthead from '@/components/ResourceList/Masthead';
import { AS_YAML, _FLAGGED } from '@/config/query-params';

export default {
  components: { Masthead, SortableTable },

  async asyncData({ store }) {
    return { templates: await store.dispatch('cluster/findAll', { type: GATEKEEPER.CONSTRAINT_TEMPLATE }) };
  },
  data(ctx) {
    const params = {
      ...this.$route.params,
      resource: GATEKEEPER.CONSTRAINT_TEMPLATE
    };

    const createLocation = {
      name: 'c-cluster-resource-create',
      params,
    };

    const yamlCreateLocation = {
      ...createLocation,
      query: { [AS_YAML]: _FLAGGED }
    };

    return {
      createLocation,
      yamlCreateLocation,
      headers: [
        STATE,
        NAME,
        {
          name:  'Kind',
          label: 'Kind',
          value: 'kind',
          sort:  'kind'
        },
        AGE,
      ],
      templates: [],
    };
  },

};
</script>

<template>
  <div class="gatekeeper-templates">
    <Masthead
      resource="gatekeeper-template"
      :type-display="'Template'"
      :is-yaml-creatable="true"
      :is-creatable="false"
      :yaml-create-location="yamlCreateLocation"
      :create-location="createLocation"
    />
    <SortableTable
      :headers="headers"
      :rows="templates"
      :search="true"
      key-field="id"
      group-by="kind"
    />
  </div>
</template>

<style lang="scss">
.gatekeeper-templates {
  button.create {
    height: 35px;
    line-height: 0;
  }
}
</style>
