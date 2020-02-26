<script>
import { STATE, AGE, NAME } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import { WORKLOAD } from '@/config/types';
export default {
  components: { SortableTable },
  computed:   {

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.resource);
    },

    headers() {
      return [STATE,
        NAME,
        // IMAGE,
        // PODS,
        // SCALE,
        AGE];
    },
  },

  asyncData(ctx) {
    const types = Object.values(WORKLOAD);

    return Promise.all( types.map((type) => {
      return ctx.store.dispatch('cluster/findAll', { type });
    }))
      .then((resources) => {
        resources = resources
          .reduce((all, rows) => {
            rows = rows.filter(row => !row.metadata.ownerReferences);
            all.push(...rows);

            return all;
          }, []);

        return { resources };
      });
  },
};
</script>

<template>
  <div>
    <header>
      <h1>
        Workloads
      </h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Create
        </nuxt-link>
      </div>
    </header>
    <SortableTable :rows="resources" :headers="headers" key-field="id" />
  </div>
</template>
