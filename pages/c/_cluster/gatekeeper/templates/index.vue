<script>
import { GATEKEEPER_CONSTRAINT_TEMPLATE } from '@/config/types';
import { AGE, NAME, STATE } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';

export default {
  components: { SortableTable },
  data(ctx) {
    const params = {
      ...this.$route.params,
      resource: GATEKEEPER_CONSTRAINT_TEMPLATE
    };
    const createUrl = this.$router.resolve({ name: 'c-cluster-resource-create', params }).href;

    return {
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
      templates:   [],
      constraints: [],
      createUrl
    };
  },

  async asyncData({ store }) {
    const templates = await store.dispatch('cluster/findAll', { type: GATEKEEPER_CONSTRAINT_TEMPLATE });
    const constraints = (await Promise.all(templates.map((template) => {
      const type = `constraints.gatekeeper.sh.${ template.id }`;

      return store.dispatch('cluster/findAll', { type });
    }))).flat();

    return {
      templates,
      constraints,
    };
  },

};
</script>

<template>
  <div class="gatekeeper-templates">
    <header>
      <h1>Templates</h1>
    </header>
    <SortableTable
      :headers="headers"
      :rows="templates"
      :search="true"
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
.gatekeeper-templates {
  button.create {
    height: 35px;
    line-height: 0;
  }
}
</style>
