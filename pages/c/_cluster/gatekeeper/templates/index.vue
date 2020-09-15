<script>
import { GATEKEEPER } from '@/config/types';
import { AGE, NAME, STATE } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import Masthead from '@/components/ResourceList/Masthead';
import { AS_YAML, _FLAGGED } from '@/config/query-params';
import { NAME as GATEKEEPER_PRODUCT } from '@/config/product/explorer';

export default {
  components: { Masthead, SortableTable },

  async asyncData({ store }) {
    return { templates: await store.dispatch('cluster/findAll', { type: GATEKEEPER.CONSTRAINT_TEMPLATE }) };
  },
  data(ctx) {
    const yamlCreateLocation = {
      name:     'c-cluster-product-resource-create',
      params:   {
        ...this.$route.params,
        product:  GATEKEEPER_PRODUCT,
        resource: GATEKEEPER.CONSTRAINT_TEMPLATE
      },
      query: { [AS_YAML]: _FLAGGED }
    };

    return {
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
