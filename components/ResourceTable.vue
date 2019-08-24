
<template>
  <div>
    <SortableTable
      :headers="headers"
      :rows="filteredRows"
      :group-by="groupBy"
      key-field="metadata.uid"
      table-actions
    >
      <template v-if="groupable" #header-middle>
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
import { mapPref, GROUP_RESOURCES } from '@/store/prefs';
import SortableTable from '@/components/SortableTable';
import { headersFor } from '@/utils/table-headers';

export default {
  components: { SortableTable },

  props: {
    resource: {
      type:     String,
      required: true,
    },
    rows: {
      type:     Array,
      required: true
    }
  },

  computed: {
    schema() {
      return this.$store.getters['v1/schemaFor'](this.resource);
    },

    headers() {
      const groupable = this.$store.getters['multipleNamespaces'];
      const groupNamespaces = this.group === 'namespace';

      return headersFor(this.schema, groupable && !groupNamespaces);
    },

    filteredRows() {
      const namespaces = this.$store.getters['namespaces'];

      if ( !this.schema.attributes.namespaced || !namespaces.length ) {
        return this.rows;
      }

      return this.rows.filter(x => namespaces.includes(x.metadata.namespace));
    },

    group: mapPref(GROUP_RESOURCES),

    groupable() {
      return this.$store.getters['multipleNamespaces'] && this.schema.attributes.namespaced;
    },

    groupBy() {
      if ( this.group === 'namespace' && this.groupable ) {
        return 'metadata.namespace';
      }

      return null;
    }
  },

  methods: {
    setGroup(group) {
      this.group = group;
    },
  },
};
</script>
