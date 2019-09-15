<script>
import { mapPref, GROUP_RESOURCES } from '@/store/prefs';
import ButtonGroup from '@/components/ButtonGroup';
import SortableTable from '@/components/SortableTable';
import { headersFor, NAMESPACE } from '@/utils/table-headers';
import { removeObject } from '@/utils/array';

export default {
  components: { ButtonGroup, SortableTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true
    },

    headers: {
      type:    Array,
      default: null,
    },
  },

  computed: {
    showNamespaceColumn() {
      const namespaced = this.schema.attributes.namespaced;
      const groupable = this.$store.getters['multipleNamespaces'];
      const groupNamespaces = this.group === 'namespace';
      const showNamespace = namespaced && groupable && !groupNamespaces;

      return showNamespace;
    },

    _headers() {
      let headers;
      const showNamespace = this.showNamespaceColumn;

      if ( this.headers ) {
        headers = this.headers.slice();
      } else {
        headers = headersFor(this.schema, showNamespace);
      }

      // This removes the namespace column from custom headers passed in
      // (and headersFor won't add it in the first place)
      if ( !showNamespace ) {
        removeObject(headers, NAMESPACE);
      }

      return headers;
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
    },

    groupOptions() {
      return [
        { value: 'none', icon: 'icon-list-flat' },
        { value: 'namespace', icon: 'icon-list-grouped' }
      ];
    },
  },

  methods: {
    setGroup(group) {
      this.group = group;
    },
  },
};
</script>

<template>
  <div>
    <SortableTable
      v-bind="$attrs"
      :headers="_headers"
      :rows="filteredRows"
      :group-by="groupBy"
      key-field="_key"
      table-actions
      v-on="$listeners"
    >
      <template v-if="groupable" #header-middle>
        <slot name="header-middle" />
        <ButtonGroup v-model="group" :options="groupOptions" />
      </template>

      <!-- Pass down templates provided by the caller -->
      <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </SortableTable>
  </div>
</template>
