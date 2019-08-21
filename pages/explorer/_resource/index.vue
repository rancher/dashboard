
<template>
  <div>
    <SortableTable
      :headers="headers"
      :rows="filteredRows"
      :group-by="groupBy"
      key-field="metadata.uid"
      table-actions
    >
      <template v-if="multipleNamespaces" #header-middle>
        <div v-trim-whitespace class="btn-group">
          <button type="button" :class="{'btn': true, 'bg-default': true, 'active': group == 'none'}" @click="setGroup('none')">
            <i class="icon icon-list-flat" />
          </button>
          <button type="button" :class="{'btn': true, 'bg-default': true, 'active': group == 'namespace'}" @click="setGroup('namespace')">
            <i class="icon icon-list-grouped" />
          </button>
        </div>
      </template>
    </SortableTable>
  </div>
</template>

<script>
import { GROUP_RESOURCES } from '@/store/prefs';
import SortableTable from '@/components/SortableTable';
import { headersFor } from '@/utils/table-headers';

export default {
  components: { SortableTable },

  computed: {
    schema() {
      return this.$store.getters['v1/schemaFor'](this.$route.params.resource);
    },

    headers() {
      const multipleNamespaces = this.$store.getters['multipleNamespaces'];
      const groupNamespaces = this.group === 'namespace';

      return headersFor(this.schema, multipleNamespaces && !groupNamespaces);
    },

    filteredRows() {
      const namespaces = this.$store.getters['namespaces'];

      if ( !this.schema.attributes.namespaced || !namespaces.length ) {
        return this.rows;
      }

      return this.rows.filter(x => namespaces.includes(x.metadata.namespace));
    },

    group: {
      get() {
        const value = this.$store.getters['prefs/get'](GROUP_RESOURCES);

        return value || 'none';
      },

      set(val) {
        this.$store.commit('prefs/set', { key: GROUP_RESOURCES, val });
      }
    },

    multipleNamespaces() {
      return this.$store.getters['multipleNamespaces'];
    },

    groupBy() {
      if ( this.group === 'namespace' && this.multipleNamespaces ) {
        return 'metadata.namespace';
      }

      return null;
    }
  },

  asyncData(ctx) {
    return ctx.store.dispatch('v1/findAll', { type: ctx.params.resource }).then((rows) => {
      return { rows };
    });
  },

  methods: {
    setGroup(group) {
      this.group = group;
    },
  },
};
</script>
