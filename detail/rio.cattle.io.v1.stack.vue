<script>
import { findBy, filterBy } from '@/utils/array';
import LoadDeps from '@/mixins/load-deps';
import Loading from '@/components/Loading';
import ResourceTable from '@/components/ResourceTable';
import { SCHEMA } from '@/config/types';
import { RIO } from '@/config/labels-annotations';
import { TO_FRIENDLY } from '@/config/friendly';

export default {
  name: 'DetailStack',

  components: { Loading, ResourceTable },
  mixins:     [LoadDeps],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return { depSchemas: [] };
  },

  computed: {
    childTypes() {
      const map = {};
      const schemas = {};

      for ( const schema of this.depSchemas ) {
        const all = this.$store.getters['cluster/all'](schema.id);

        const relevant = filterBy(all, {
          'metadata.namespace':                 this.value.metadata.namespace,
          [`metadata.labels.'${ RIO.STACK }'`]: this.value.metadata.name,
        });

        map[schema.id] = relevant;
        schemas[schema.id] = schema;
      }

      const out = Object.keys(map).map((key) => {
        const schema = schemas[key];
        const friendly = TO_FRIENDLY[schema.id];
        let label = schema.kind;
        let headers = null;

        if ( friendly ) {
          label = friendly.plural;
          headers = friendly.headers;
        }

        return {
          id:     key,
          label,
          schema,
          headers,
          rows:   map[key],
        };
      });

      return out;
    }
  },

  methods: {
    loadDeps() {
      const deps = [];

      const all = this.$store.getters['cluster/all'](SCHEMA);
      const additional = this.value.spec.additionalGroupVersionKinds || [];
      const seen = {};

      for ( const entry of additional ) {
        const key = `${ entry.Group }.${ entry.Version }.${ entry.Kind }`;

        if ( seen[key] ) {
          continue;
        } else {
          seen[key] = true;
        }

        const schema = findBy(all, {
          'attributes.kind':    entry.Kind,
          'attributes.group':   entry.Group,
          'attributes.version': entry.Version,
        });

        if ( schema ) {
          this.depSchemas.push(schema);
          deps.push(this.$store.dispatch('cluster/findAll', { type: schema.id }));
        } else {
          console.error('Unable to find schema for additional GVK', entry);
        }
      }

      return Promise.all(deps);
    }
  },
};
</script>
<template>
  <div>
    <Loading ref="loader" />
    <div v-if="loading" />
    <div v-else class="stack-detail">
      <div class="detail-top">
        <div>
          <span>Namespace</span>
          <span>{{ value.metadata.namespace }}</span>
        </div>
      </div>
      <div>
        <div v-for="(obj,idx) in childTypes" :key="obj.id" class=" mt-20">
          <h4 class="mb-10">
            {{ obj.label }}
          </h4>
          <ResourceTable :schema="obj.schema" :rows="obj.rows" :headers="obj.headers" :show-groups="false" />
          <hr v-if="idx<childTypes.length" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.stack-detail {
  height: 100%;
}
</style>
