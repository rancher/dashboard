<script>
import { mapGetters } from 'vuex';
import { get } from '@shell/utils/object';
import { mapPref, GROUP_RESOURCES } from '@shell/store/prefs';
import ButtonGroup from '@shell/components/ButtonGroup';
import SortableTable from '@shell/components/SortableTable';
import { NAMESPACE } from '@shell/config/table-headers';
import { findBy } from '@shell/utils/array';

// Default group-by in the case the group stored in the preference does not apply
const DEFAULT_GROUP = 'namespace';

export const defaultTableSortGenerationFn = (schema, $store) => {
  if ( !schema ) {
    return null;
  }

  const resource = schema.id;
  let sortKey = resource;

  const inStore = $store.getters['currentStore'](resource);
  const generation = $store.getters[`${ inStore }/currentGeneration`]?.(resource);

  if ( generation ) {
    sortKey += `/${ generation }`;
  }

  const nsFilterKey = $store.getters['activeNamespaceCacheKey'];

  if ( nsFilterKey ) {
    return `${ sortKey }/${ nsFilterKey }`;
  }
};

export default {

  name: 'ResourceTable',

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

    loading: {
      type:     Boolean,
      required: false
    },

    headers: {
      type:    Array,
      default: null,
    },

    groupBy: {
      type:    String,
      default: null
    },

    namespaced: {
      type:    Boolean,
      default: null, // Automatic from schema
    },

    search: {
      // Show search input to filter rows
      type:    Boolean,
      default: true
    },

    tableActions: {
      // Show bulk table actions
      type:    [Boolean, null],
      default: null
    },

    pagingLabel: {
      type:    String,
      default: 'sortableTable.paging.resource',
    },

    rowActions: {
      type:    Boolean,
      default: true,
    },

    groupable: {
      type:    Boolean,
      default: null, // Null: auto based on namespaced and type custom groupings
    },

    groupTooltip: {
      type:    String,
      default: 'resourceTable.groupBy.namespace',
    },

    overflowX: {
      type:    Boolean,
      default: false
    },
    overflowY: {
      type:    Boolean,
      default: false
    },
    sortGenerationFn: {
      type:    Function,
      default: null,
    },
    getCustomDetailLink: {
      type:    Function,
      default: null
    },

    ignoreFilter: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    const options = this.$store.getters[`type-map/optionsFor`](this.schema);
    const listGroups = options?.listGroups || [];
    const listGroupMapped = listGroups.reduce((acc, grp) => {
      acc[grp.value] = grp;

      return acc;
    }, {});

    return { listGroups, listGroupMapped };
  },

  computed: {
    ...mapGetters(['currentProduct']),
    isNamespaced() {
      if ( this.namespaced !== null ) {
        return this.namespaced;
      }

      return !!get( this.schema, 'attributes.namespaced');
    },

    showNamespaceColumn() {
      const groupNamespaces = this.group === 'namespace';
      const out = !this.showGrouping || !groupNamespaces;

      return out;
    },

    _showBulkActions() {
      if (this.tableActions !== null) {
        return this.tableActions;
      } else if (this.schema) {
        const hideTableActions = this.$store.getters['type-map/hideBulkActionsFor'](this.schema);

        return !hideTableActions;
      }

      return false;
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

      // If we are grouping by a custom group, it may specify that we hide a specific column
      const custom = this.listGroupMapped[this.group];

      if (custom?.hideColumn) {
        const idx = headers.findIndex(header => header.name === custom.hideColumn);

        if ( idx >= 0 ) {
          headers.splice(idx, 1);
        }
      }

      return headers;
    },

    filteredRows() {
      const isAll = this.$store.getters['isAllNamespaces'];

      // If the resources isn't namespaced or we want ALL of them, there's nothing to do.
      if ( !this.isNamespaced || (isAll && !this.currentProduct?.hideSystemResources) || this.ignoreFilter) {
        return this.rows || [];
      }

      const includedNamespaces = this.$store.getters['namespaces']();

      // Shouldn't happen, but does for resources like management.cattle.io.preference
      if (!this.rows) {
        return [];
      }

      return this.rows.filter((row) => {
        if (this.currentProduct?.hideSystemResources && this.isNamespaced) {
          return !!includedNamespaces[row.metadata.namespace] && !row.isSystemResource;
        } else if (!this.isNamespaced) {
          return true;
        } else {
          return !!includedNamespaces[row.metadata.namespace];
        }
      });
    },

    _group: mapPref(GROUP_RESOURCES),

    // The group stored in the preference (above) might not be valid for this resource table - so ensure we
    // choose a group that is applicable (the default)
    // This saves us from having to store a group preference per resource type - given that custom groupings aer not used much
    // and it feels like a good UX to be able to keep the namespace/flat grouping across tables
    group: {
      get() {
        // Check group is valid
        const exists = this.groupOptions.find(g => g.value === this._group);

        if (!exists) {
          return DEFAULT_GROUP;
        }

        return this._group;
      },
      set(value) {
        this._group = value;
      }
    },

    showGrouping() {
      if ( this.groupable === null ) {
        const namespaceGroupable = this.$store.getters['isMultipleNamespaces'] && this.isNamespaced;
        const customGroupable = this.listGroups.length > 0;

        return namespaceGroupable || customGroupable;
      }

      return this.groupable || false;
    },

    computedGroupBy() {
      if ( this.groupBy ) {
        return this.groupBy;
      }

      if ( this.group === 'namespace' && this.showGrouping ) {
        return 'groupByLabel';
      }

      const custom = this.listGroupMapped[this.group];

      if (custom && custom.field) {
        return custom.field;
      }

      return null;
    },

    groupOptions() {
      const standard = [
        {
          tooltipKey: 'resourceTable.groupBy.none',
          icon:       'icon-list-flat',
          value:      'none',
        },
        {
          tooltipKey: this.groupTooltip,
          icon:       'icon-folder',
          value:      'namespace',
        },
      ];

      return standard.concat(this.listGroups);
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

  methods: {
    keyAction(action) {
      const table = this.$refs.table;

      if ( !table ) {
        return;
      }

      const selection = table.selectedRows;

      if ( action === 'remove' ) {
        const act = findBy(table.availableActions, 'action', 'promptRemove');

        if ( act ) {
          table.setBulkActionOfInterest(act);
          table.applyTableAction(act);
        }

        return;
      }

      if ( selection.length !== 1 ) {
        return;
      }

      switch ( action ) {
      case 'detail':
        selection[0].goToDetail();
        break;
      case 'edit':
        selection[0].goToEdit();
        break;
      case 'yaml':
        selection[0].goToViewYaml();
        break;
      }
    },

    clearSelection() {
      this.$refs.table.clearSelection();
    },

    safeSortGenerationFn() {
      if (this.sortGenerationFn) {
        return this.sortGenerationFn(this.schema, this.$store);
      }

      return defaultTableSortGenerationFn(this.schema, this.$store);
    },

    handleActionButtonClick(event) {
      this.$emit('clickedActionButton', event);
    }
  }
};
</script>

<template>
  <SortableTable
    ref="table"
    v-bind="$attrs"
    :headers="_headers"
    :rows="filteredRows"
    :loading="loading"
    :group-by="computedGroupBy"
    :search="search"
    :paging="true"
    :paging-params="pagingParams"
    :paging-label="pagingLabel"
    :row-actions="rowActions"
    :table-actions="_showBulkActions"
    :overflow-x="overflowX"
    :overflow-y="overflowY"
    :get-custom-detail-link="getCustomDetailLink"
    key-field="_key"
    :sort-generation-fn="safeSortGenerationFn"
    @clickedActionButton="handleActionButtonClick"
    v-on="$listeners"
  >
    <template v-if="showGrouping" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup v-model="group" :options="groupOptions" />
    </template>

    <template v-if="showGrouping" #header-right>
      <slot name="header-right" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div class="group-tab" v-html="thisGroup.ref" />
    </template>

    <!-- Pass down templates provided by the caller -->
    <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>

    <template #shortkeys>
      <button v-shortkey.once="['enter']" class="hide detail" @shortkey="keyAction('detail')" />
      <button v-shortkey.once="['e']" class="hide" @shortkey="keyAction('edit')" />
      <button v-shortkey.once="['y']" class="hide" @shortkey="keyAction('yaml')" />
      <button v-if="_showBulkActions" v-shortkey.once="['del']" class="hide" @shortkey="keyAction('remove')" />
      <button v-if="_showBulkActions" v-shortkey.once="['backspace']" class="hide" @shortkey="keyAction('remove')" />
    </template>
  </SortableTable>
</template>
