<script>
import { AGE, NAME, STATE } from '@shell/config/table-headers';
import SortableTable from '@shell/components/SortableTable';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { findAllConstraints } from '@shell/utils/gatekeeper/util';
import Masthead from '@shell/components/ResourceList/Masthead';
import { AS, _YAML } from '@shell/config/query-params';

export default {
  components: { Masthead, SortableTable },
  data(ctx) {
    const createLocation = {
      name:   'c-cluster-gatekeeper-constraints-create',
      params: this.$route.params,
    };

    const yamlCreateLocation = {
      ...createLocation,
      query: { [AS]: _YAML }
    };

    return {
      createLocation,
      yamlCreateLocation,
      headers: [
        STATE,
        NAME,
        {
          name:  'Description',
          label: 'Description',
          value: `description`,
          sort:  `description`
        },
        {
          name:  'Violations',
          label: 'Violations',
          value: 'status.totalViolations',
          sort:  'status.totalViolations',
          width: 120
        },
        AGE,
      ],
      templates:   [],
      constraints: [],
    };
  },

  async created() {
    const rawConstraints = await findAllConstraints(this.$store);

    this.constraints = rawConstraints
      .flat()
      .map((constraint) => {
        constraint.description = (constraint?.metadata?.annotations || {})[DESCRIPTION];

        return constraint;
      });
  }

};
</script>

<template>
  <div class="gatekeeper-constraints">
    <Masthead
      resource="Constraint"
      :type-display="'Constraint'"
      :is-yaml-creatable="true"
      :is-creatable="true"
      :yaml-create-location="yamlCreateLocation"
      :create-location="createLocation"
    />

    <SortableTable
      :headers="headers"
      :rows="constraints"
      key-field="id"
      group-by="kind"
    />
  </div>
</template>

<style lang="scss">
.gatekeeper-constraints {
  button.create {
    height: 35px;
    line-height: 0;
  }
}
</style>
