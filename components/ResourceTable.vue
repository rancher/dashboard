<script>
import { get } from '@/utils/object';
import { mapPref, GROUP_RESOURCES } from '@/store/prefs';
import ButtonGroup from '@/components/ButtonGroup';
import SortableTable from '@/components/SortableTable';
import { NAMESPACE } from '@/config/table-headers';

export default {
  components: { ButtonGroup, SortableTable },

  props: {
    schema: {
      type:    Object,
      default: null,
    },

    rows: {
      type:     Array,
      required: true
    },

    headers: {
      type:    Array,
      default: null,
    },

    showGroups: {
      type:    Boolean,
      default: true,
    },
    forceNamespaced: {
      type:    Boolean,
      default: false,
    },

    search: {
      // Show search input to filter rows
      type:    Boolean,
      default: true
    },
    tableActions: {
      // Show bulk table actions
      type:    Boolean,
      default: true
    },

    pagingLabel: {
      type:    String,
      default: 'sortableTable.paging.resource',
    },
  },

  computed: {
    namespaced() {
      const namespaced = !!get( this.schema, 'attributes.namespaced') || this.forceNamespaced;

      return namespaced;
    },

    showNamespaceColumn() {
      const groupNamespaces = this.group === 'namespace';
      const out = this.groupable && !groupNamespaces;

      return out;
    },

    _headers() {
      let headers;
      const showNamespace = this.showNamespaceColumn;

      if ( this.headers ) {
        headers = this.headers.slice();
      } else {
        headers = this.$store.getters['type-map/headersFor'](this.schema);
      }

      // If only one namespace is selected, hide the namespace column
      if ( !showNamespace ) {
        const idx = headers.findIndex(header => header.name === NAMESPACE.name);

        if ( idx >= 0 ) {
          headers.splice(idx, 1);
        }
      }

      return headers;
    },

    filteredRows() {
      const isAll = this.$store.getters['isAllNamespaces'];

      // If the resources isn't namespaced or we want ALL of them, there's nothing to do.
      if ( !this.namespaced || isAll ) {
        return this.rows;
      }

      const includedNamespaces = this.$store.getters['namespaces']();

      return this.rows.filter((row) => {
        return !!includedNamespaces[row.metadata.namespace];
      });
    },

    group: mapPref(GROUP_RESOURCES),

    groupable() {
      return this.$store.getters['isMultipleNamespaces'] && this.namespaced;
    },

    groupBy() {
      if ( this.group === 'namespace' && this.groupable && this.showGroups) {
        return 'groupByLabel';
      }

      return null;
    },

    groupOptions() {
      return [
        { value: 'none', icon: 'icon-list-flat' },
        { value: 'namespace', icon: 'icon-list-grouped' }
      ];
    },

    pagingParams() {
      if ( !this.schema ) {
        return {};
      }

      return {
        singularLabel: this.$store.getters['type-map/labelFor'](this.schema),
        pluralLabel:   this.$store.getters['type-map/labelFor'](this.schema, 99),
      };
    },
  },
};
</script>

<template>
  <SortableTable
    v-bind="$attrs"
    :headers="_headers"
    :rows="filteredRows"
    :group-by="groupBy"
    :search="search"
    :paging="true"
    :paging-params="pagingParams"
    :paging-label="pagingLabel"
    :table-actions="tableActions"
    key-field="_key"
    v-on="$listeners"
  >
    <template v-if="groupable && showGroups" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup v-model="group" :options="groupOptions" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div class="group-tab" v-html="thisGroup.ref" />
    </template>

    <!-- Pass down templates provided by the caller -->
    <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </SortableTable>
</template>
