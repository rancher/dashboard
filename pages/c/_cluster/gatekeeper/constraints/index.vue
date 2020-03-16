<script>
import { AGE, NAME, STATE } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import { DESCRIPTION } from '@/config/labels-annotations';
import { findAllConstraints } from '@/utils/gatekeeper/util';

export default {
  components: { SortableTable },
  data(ctx) {
    const createUrl = this.$router.resolve({ name: 'c-cluster-gatekeeper-constraints-create', params: this.$route.params }).href;

    return {
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
      createUrl
    };
  },

  async created() {
    const rawConstraints = await findAllConstraints(this.$store);

    this.constraints = rawConstraints
      .flat()
      .map((constraint) => {
        constraint.description = constraint.metadata.annotations[DESCRIPTION];

        return constraint;
      });
  }

};
</script>

<template>
  <div class="gatekeeper-constraints">
    <header>
      <h1>Constraints</h1>
    </header>
    <SortableTable
      :headers="headers"
      :rows="constraints"
      key-field="id"
      group-by="kind"
    >
      <template v-slot:header-end>
        <nuxt-link :to="createUrl" append tag="button" type="button" class="create btn bg-primary">
          Create
        </nuxt-link>
      </template>
    </SortableTable>
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
