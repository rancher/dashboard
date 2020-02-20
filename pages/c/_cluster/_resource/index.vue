<script>
import {
  STATE, CREATED, NAME, IMAGE, PODS, SCALE
} from '../../../../config/table-headers';
import { get } from '@/utils/object';
import ResourceTable from '@/components/ResourceTable';
import SortableTable from '@/components/SortableTable';
import { FRIENDLY } from '@/config/friendly';
import { WORKLOAD } from '@/config/types';

export default {
  components: {
    ResourceTable,
    SortableTable
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.resource);
    },

    headers() {
      if (this.isWorkload) {
        return [STATE,
          NAME,
          // IMAGE,
          // PODS,
          // SCALE,
          CREATED];
      }

      return get(FRIENDLY[this.resource], 'headers');
    },
  },

  asyncData(ctx) {
    const resource = ctx.params.resource;
    const isWorkload = resource === 'workload';

    if (isWorkload) {
      const types = Object.values(WORKLOAD);

      return Promise.all( types.map((type) => {
        return ctx.store.dispatch('cluster/findAll', { type });
      })).then((resources) => {
        resources = resources.reduce((all, rows) => {
          rows = rows.filter(row => !row.metadata.ownerReferences);

          all.push(...rows);

          return all;
        }, []);
        // .filter(resource => resource.rows.length);

        return { resources, isWorkload };
      });
    }

    return ctx.store.dispatch('cluster/findAll', { type: resource }).then((rows) => {
      return {
        resource,
        rows,
        isWorkload: false
      };
    });
  },
}; </script>

<template>
  <div v-if="isWorkload">
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
    <!-- <div v-for="resource in resources" :key="resource.type">
      <h4 class="mt-20">
        {{ resource.type }}
      </h4>
      <ResourceTable :schema="resource.schema" :rows="resource.rows" :headers="headers" />
    </div> -->
  </div>
  <div v-else>
    <header>
      <h1>
        {{ typeDisplay }}
      </h1>
      <div class="actions">
        <nuxt-link to="create" append tag="button" type="button" class="btn bg-primary">
          Create
        </nuxt-link>
      </div>
    </header>
    <div v-if="hasComponent">
      <component
        :is="showComponent"
        :schema="schema"
        :rows="rows"
        :headers="headers"
      />
    </div>
    <ResourceTable v-else :schema="schema" :rows="rows" :headers="headers" />
  </div>
</template>

<style lang="scss" scoped>
  .header {
    position: relative;
  }

  H2 {
    position: relative;
    margin: 0 0 20px 0;
  }

  .right-action {
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>
