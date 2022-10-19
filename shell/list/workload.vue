<script>
import ResourceTable from '@shell/components/ResourceTable';
import { WORKLOAD_TYPES, SCHEMA, NODE, POD } from '@shell/config/types';
// import { WORKLOAD_TYPES, SCHEMA, NODE } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { quickHashObj } from '@shell/utils/crypto';
import cloneDeep from 'lodash/cloneDeep';

const schema = {
  id:         'workload',
  type:       SCHEMA,
  attributes: {
    kind:       'Workload',
    namespaced: true
  },
  metadata: { name: 'workload' },
};

export default {
  name:       'ListWorkload',
  components: { ResourceTable },
  mixins:     [ResourceFetch],

  async fetch() {
    try {
      const schema = this.$store.getters[`cluster/schemaFor`](NODE);

      if (schema) {
        this.$store.dispatch('cluster/findAll', { type: NODE });
      }
    } catch {}

    let resources;

    this.loadHeathResources();

    if ( this.allTypes && !this.perfConfig.advancedWorker ) {
      const allowedResources = [];

      Object.values(WORKLOAD_TYPES).forEach((type) => {
        // You may not have RBAC to see some of the types
        if (this.$store.getters['cluster/schemaFor'](type) ) {
          allowedResources.push(type);
        }
      });

      resources = await Promise.all(allowedResources.map((allowed) => {
        return this.$fetchType(allowed, allowedResources);
      }));
    } else if (this.allTypes) {
      // ToDo: this'll work with advanced worker, gotta go back and make sure basic still works (it currently wouldn't...)
      const res = await this.$store.dispatch('cluster/findPage', {
        type: 'workload', opt: this.resourceQuery, schema
      });

      resources = [res];
    } else {
      const type = this.$route.params.resource;

      if ( this.$store.getters['cluster/schemaFor'](type) ) {
        const resource = await this.$fetchType(type);

        resources = [resource];
      }
    }

    this.resources = resources;
  },

  data() {
    return { resources: [] };
  },

  computed: {
    allTypes() {
      return this.$route.params.resource === schema.id;
    },

    schema() {
      const { params:{ resource:type } } = this.$route;

      if (type !== schema.id) {
        return this.$store.getters['cluster/schemaFor'](type);
      }

      return schema;
    },

    filteredRows() {
      const out = [];

      for ( const typeRows of this.resources ) {
        if ( !typeRows ) {
          continue;
        }

        for ( const row of typeRows ) {
          if (!this.allTypes || row.showAsWorkload) {
            out.push(row);
          }
        }
      }

      return out;
    },

    listLength() {
      const { params: { resource: type } } = this.$route;

      // if (type !== schema.id) {
      return this.$store.getters['cluster/listLength'](type);
      // }

      // return undefined;
    }
  },

  // All of the resources that we will load that we need for the loading indicator
  $loadingResources(route, store) {
    const allTypes = route.params.resource === schema.id;

    const allowedResources = [];

    Object.values(WORKLOAD_TYPES).forEach((type) => {
      // You may not have RBAC to see some of the types
      if (store.getters['cluster/schemaFor'](type) ) {
        allowedResources.push(type);
      }
    });

    return {
      loadResources:     allTypes ? allowedResources : [route.params.resource],
      loadIndeterminate: allTypes,
    };
  },

  methods: {
    loadHeathResources() {
      // Fetch these in the background to populate workload health
      if ( this.allTypes && !this.perfConfig?.advancedWorker) {
        this.$store.dispatch('cluster/findAll', { type: POD });
        this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB });
      } else {
        const type = this.$route.params.resource;

        if (type === WORKLOAD_TYPES.JOB) {
          // Ignore job (we're fetching this anyway, plus they contain their own state)

        }
        if (!this.perfConfig?.advancedWorker) {
          if (type === WORKLOAD_TYPES.CRON_JOB) {
            this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.JOB });
          } else {
            this.$store.dispatch('cluster/findAll', { type: POD });
          }
        }
      }
    },
    setPage(num) {
      const currentResourceQueryHash = quickHashObj(this.resourceQuery);
      const resourceQueryClone = cloneDeep(this.resourceQuery);

      resourceQueryClone.page = num;
      if (currentResourceQueryHash !== quickHashObj(resourceQueryClone)) {
        this.resourceQuery = { ...resourceQueryClone };
      }

      const { params:{ resource:type } } = this.$route;

      this.$store.dispatch('cluster/updateResourceParams', { type, page: num });
    }
  },

  typeDisplay() {
    const { params:{ resource:type } } = this.$route;
    let paramSchema = schema;

    if (type !== schema.id) {
      paramSchema = this.$store.getters['cluster/schemaFor'](type);
    }

    return this.$store.getters['type-map/labelFor'](paramSchema, 99);
  },
};
</script>

<template>
  <div>
    <ResourceTable
      :loading="$fetchState.pending"
      :schema="schema"
      :rows="filteredRows"
      :overflow-y="true"
      :set-page-fn="setPage"
      :list-length="listLength"
    />
  </div>
</template>
