<script>
import { mapGetters } from 'vuex';
import { get } from '@shell/utils/object';
import { mapPref, GROUP_RESOURCES } from '@shell/store/prefs';
import ButtonGroup from '@shell/components/ButtonGroup';
import SortableTable from '@shell/components/SortableTable';
import { NAMESPACE, AGE } from '@shell/config/table-headers';
import { findBy } from '@shell/utils/array';
import { ExtensionPoint, TableColumnLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';

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

  // covers case where we have no current cluster's ns cache
  return sortKey;
};

export default {

  name: 'ResourceTable',

  emits: ['clickedActionButton'],

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

    altLoading: {
      type:     Boolean,
      required: false
    },

    keyField: {
      // Field that is unique for each row.
      type:    String,
      default: '_key',
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

    /**
     * Additional params to pass to the pagingLabel translation
     */
    pagingParams: {
      type:    Object,
      default: null,
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
    hasAdvancedFiltering: {
      type:    Boolean,
      default: false
    },
    advFilterHideLabelsAsCols: {
      type:    Boolean,
      default: false
    },
    advFilterPreventFilteringLabels: {
      type:    Boolean,
      default: false
    },
    /**
     * Allows for the usage of a query param to work for simple filtering (q)
     */
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },
    /**
     * Manual force the update of live and delayed cells. Change this number to kick off the update
     */
    forceUpdateLiveAndDelayed: {
      type:    Number,
      default: 0
    },

    externalPaginationEnabled: {
      type:    Boolean,
      default: false
    },

    externalPaginationResult: {
      type:    Object,
      default: null
    },

    rowsPerPage: {
      type:    Number,
      default: null, // Default comes from the user preference
    },

    hideGroupingControls: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    // Confirm which store we're in, if schema isn't available we're probably showing a list with different types
    const inStore = this.schema?.id ? this.$store.getters['currentStore'](this.schema.id) : undefined;

    return {
      inStore,
      /**
       * Override the sortGenerationFn given changes in the rows we pass through to sortable table
       *
       * Primary purpose is to directly connect an iteration of `rows` with a sortGeneration string. This avoids
       * reactivity issues where `rows` hasn't yet changed but something like workspaces has (stale values stored against fresh key)
       */
      sortGeneration: undefined
    };
  },

  watch: {
    filteredRows: {
      handler() {
        // This is only prevalent in fleet world and the workspace switcher
        // - it's singular (a --> b --> c) instead of namespace switchers additive (a --> a+b --> a)
        // - this means it's much more likely to switch between resource sets containing the same mount of rows
        //
        if (this.currentProduct.showWorkspaceSwitcher) {
          this.sortGeneration = this.safeSortGenerationFn(this.schema, this.$store);
        }
      },
      immediate: true
    }
  },

  computed: {
    options() {
      return this.$store.getters[`type-map/optionsFor`](this.schema, this.externalPaginationEnabled);
    },

    _listGroupMapped() {
      return this.options?.listGroups?.reduce((acc, grp) => {
        acc[grp.value] = grp;

        return acc;
      }, {});
    },

    _mandatorySort() {
      return this.options?.listMandatorySort;
    },

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
        headers = this.$store.getters['type-map/headersFor'](this.schema, this.externalPaginationEnabled);
      }

      // add custom table columns provided by the extensions ExtensionPoint.TABLE_COL hook
      // gate it so that we prevent errors on older versions of dashboard
      if (this.$store.$plugin?.getUIConfig) {
        const extensionCols = getApplicableExtensionEnhancements(this, ExtensionPoint.TABLE_COL, TableColumnLocation.RESOURCE, this.$route);

        // Try and insert the columns before the Age column
        let insertPosition = headers.length;

        if (headers.length > 0) {
          const ageColIndex = headers.findIndex((h) => h.name === AGE.name);

          if (ageColIndex >= 0) {
            insertPosition = ageColIndex;
          } else {
            // we've found some labels with ' ', which isn't necessarily empty (explore action/button)
            // if we are to add cols, let's push them before these so that the UI doesn't look weird
            const lastViableColIndex = headers.findIndex((h) => (!h.label || !h.label?.trim()) && (!h.labelKey || !h.labelKey?.trim()));

            if (lastViableColIndex >= 0) {
              insertPosition = lastViableColIndex;
            }
          }
        }

        // adding extension defined cols to the correct header config
        extensionCols.forEach((col) => {
          // we need the 'value' prop to be populated in order for the rows to show the values
          if (!col.value && col.getValue) {
            col.value = col.getValue;
          }
          headers.splice(insertPosition, 0, col);
        });
      }

      // If only one namespace is selected, hide the namespace column
      if ( !showNamespace ) {
        const idx = headers.findIndex((header) => header.name === NAMESPACE.name);

        if ( idx >= 0 ) {
          headers.splice(idx, 1);
        }
      }

      // If we are grouping by a custom group, it may specify that we hide a specific column
      const custom = this._listGroupMapped?.[this.group];

      if (custom?.hideColumn) {
        const idx = headers.findIndex((header) => header.name === custom.hideColumn);

        if ( idx >= 0 ) {
          headers.splice(idx, 1);
        }
      }

      return headers;
    },

    /**
     * Take rows and filter out entries given the namespace filter
     */
    filteredRows() {
      const isAll = this.$store.getters['isAllNamespaces'];

      // Do we need to filter by namespace like things?
      if (
        !this.isNamespaced || // Resource type isn't namespaced
        this.ignoreFilter || // Component owner strictly states no filtering
        this.externalPaginationEnabled ||
        (isAll && !this.currentProduct?.hideSystemResources) || // Need all
        (this.inStore ? this.$store.getters[`${ this.inStore }/haveNamespace`](this.schema.id)?.length : false)// Store reports type has namespace filter, so rows already contain the correctly filtered resources
      ) {
        return this.rows || [];
      }

      const includedNamespaces = this.$store.getters['namespaces']();

      // Shouldn't happen, but does for resources like management.cattle.io.preference
      if (!this.rows) {
        return [];
      }

      const haveAllNamespace = this.$store.getters['haveAllNamespace'];

      return this.rows.filter((row) => {
        if (this.currentProduct?.hideSystemResources && this.isNamespaced) {
          return !!includedNamespaces[row.metadata.namespace] && !row.isSystemResource;
        } else if (!this.isNamespaced) {
          return true;
        } else if (haveAllNamespace) {
          // `rows` only contains resource from a single namespace
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
        const exists = this.groupOptions.find((g) => g.value === this._group);

        if (!exists) {
          // Attempt to find the default option in available options...
          // if not use the first value in the options collection...
          // and if not that just fall back to the default
          if (this.groupOptions.find((g) => g.value === DEFAULT_GROUP)) {
            return DEFAULT_GROUP;
          }

          return this.groupOptions[0]?.value || DEFAULT_GROUP;
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
        const customGroupable = !!this.options?.listGroups?.length;

        return namespaceGroupable || customGroupable;
      }

      return this.groupable || false;
    },

    computedGroupBy() {
      // If we're not showing grouping options we shouldn't have a group by property
      if (!this.showGrouping) {
        return null;
      }

      if ( this.groupBy ) {
        // This probably comes from the type-map config for the resource (see ResourceList)
        return this.groupBy;
      }

      if ( this.group === 'namespace' ) {
        // This switches to group rows by a key which is the label for the group (??)
        return 'groupByLabel';
      }

      const custom = this._listGroupMapped?.[this.group];

      if (custom?.field) {
        // Override the normal filtering
        return custom.field;
      }

      return null;
    },

    groupOptions() {
      // Ignore the defaults below, we have an override set of groups
      // REPLACE (instead of SUPPLEMENT) defaults with listGroups (given listGroupsWillOverride is true)
      if (this.options?.listGroupsWillOverride && !!this.options?.listGroups?.length) {
        return this.options?.listGroups;
      }

      const standard = [
        {
          tooltipKey: 'resourceTable.groupBy.none',
          icon:       'icon-list-flat',
          value:      'none',
        }
      ];

      if (!this.options?.hiddenNamespaceGroupButton) {
        standard.push( {
          tooltipKey: this.groupTooltip,
          icon:       'icon-folder',
          value:      'namespace',
        });
      }

      // SUPPLEMENT (instead of REPLACE) defaults with listGroups (given listGroupsWillOverride is false)
      if (!!this.options?.listGroups?.length) {
        return standard.concat(this.options.listGroups);
      }

      return standard;
    },

    parsedPagingParams() {
      if (this.pagingParams) {
        return this.pagingParams;
      }

      if ( !this.schema ) {
        return {
          singularLabel: '',
          pluralLabel:   ''
        };
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
    },

    handleEnterKeyPress(event) {
      if (event.key === 'Enter') {
        this.keyAction('detail');
      }
    }
  },
};
</script>

<template>
  <SortableTable
    ref="table"
    v-bind="$attrs"
    :headers="_headers"
    :rows="filteredRows"
    :loading="loading"
    :alt-loading="altLoading"
    :group-by="computedGroupBy"
    :group="group"
    :group-options="groupOptions"
    :search="search"
    :paging="true"
    :paging-params="parsedPagingParams"
    :paging-label="pagingLabel"
    :rows-per-page="rowsPerPage"
    :row-actions="rowActions"
    :table-actions="_showBulkActions"
    :overflow-x="overflowX"
    :overflow-y="overflowY"
    :get-custom-detail-link="getCustomDetailLink"
    :has-advanced-filtering="hasAdvancedFiltering"
    :adv-filter-hide-labels-as-cols="advFilterHideLabelsAsCols"
    :adv-filter-prevent-filtering-labels="advFilterPreventFilteringLabels"
    :key-field="keyField"
    :sortGeneration="sortGeneration"
    :sort-generation-fn="safeSortGenerationFn"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    :external-pagination-enabled="externalPaginationEnabled"
    :external-pagination-result="externalPaginationResult"
    :mandatory-sort="_mandatorySort"
    @clickedActionButton="handleActionButtonClick"
    @group-value-change="group = $event"
    @enter="handleEnterKeyPress"
  >
    <template
      v-if="!hideGroupingControls && showGrouping"
      #header-middle
    >
      <slot name="more-header-middle" />

      <ButtonGroup
        v-model:value="group"
        :options="groupOptions"
      />
    </template>

    <template
      v-if="showGrouping"
      #header-right
    >
      <slot name="header-right" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div
        v-clean-html="thisGroup.ref"
        class="group-tab"
      />
    </template>

    <!-- Pass down templates provided by the caller -->
    <template
      v-for="(_, slot) of $slots"
      :key="slot"
      v-slot:[slot]="scope"
    >
      <slot
        :name="slot"
        v-bind="scope"
      />
    </template>

    <template #shortkeys>
      <button
        v-shortkey.once="['e']"
        class="hide"
        @shortkey="keyAction('edit')"
      />
      <button
        v-shortkey.once="['y']"
        class="hide"
        @shortkey="keyAction('yaml')"
      />
      <button
        v-if="_showBulkActions"
        v-shortkey.once="['del']"
        class="hide"
        @shortkey="keyAction('remove')"
      />
      <button
        v-if="_showBulkActions"
        v-shortkey.once="['backspace']"
        class="hide"
        @shortkey="keyAction('remove')"
      />
    </template>
  </SortableTable>
</template>
