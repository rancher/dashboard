<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';
import { get } from '@shell/utils/object';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { mapPref, GROUP_RESOURCES } from '@shell/store/prefs';
import ButtonGroup from '@shell/components/ButtonGroup';
import SortableTable from '@shell/components/SortableTable';
import { NAMESPACE, AGE } from '@shell/config/table-headers';
import { COUNT } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import { ExtensionPoint, TableColumnLocation, TableLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import ResourceTableWatch from '@shell/mixins/resource-table-watch';
import paginationUtils from '@shell/utils/pagination-utils';
import TableViewsBar from '@shell/components/TableViews/TableViewsBar';
import { downloadFile } from '@shell/utils/download';
import {
  LABEL_FIELD_PREFIX,
  applyQuery,
  decodeView,
  fieldValue,
  fieldsFor,
  findField,
  headerFieldId,
  isIgnoredColumn,
  parseQuery,
  rowsToCsv,
  rowsToJson,
  stringifyValue,
  termsToServerFilters,
  isCoreField,
  serverPathFor,
} from '@shell/utils/table-views';

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

  emits: ['clickedActionButton', 'view-filters-changed'],

  components: {
    ButtonGroup, SortableTable, TableViewsBar, ToggleSwitch
  },

  mixins: [
    ResourceTableWatch
  ],

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

    /**
     * Field to group rows by, row[groupBy] must be something that can be a map key
     */
    groupBy: {
      type:    String,
      default: null
    },

    /**
     * Override any product based group options
     */
    groupOptions: {
      type:    Array,
      default: null
    },

    groupable: {
      type:    Boolean,
      default: null, // Null: auto based on namespaced and type custom groupings
    },

    /**
     * If the current preference for group isn't applicable, or not set, use this instead
     */
    groupDefault: {
      type:    String,
      default: DEFAULT_GROUP,
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

    overrideInStore: {
      type:    String,
      default: undefined,
    },

    /**
     * Show the table views toolbar (query, columns, group by, export, saved views).
     * Null means "decide automatically" - on for any table showing a known resource type
     */
    tableViews: {
      type:    Boolean,
      default: null,
    },

  },

  data() {
    // Confirm which store we're in, if schema isn't available we're probably showing a list with different types
    const inStore = this.overrideInStore || (this.schema?.id ? this.$store.getters['currentStore'](this.schema.id) : undefined);

    // A shared view can arrive in the url, eg ?view=<encoded>
    const shared = decodeView(this.$route?.query?.view);

    return {
      inStore,
      view: {
        query:        shared?.query || '',
        columns:      shared?.columns || null,
        labelColumns: shared?.labelColumns || [],
        groupBy:      shared?.groupBy || null,
      },
      /**
       * Override the sortGenerationFn given changes in the rows we pass through to sortable table
       *
       * Primary purpose is to directly connect an iteration of `rows` with a sortGeneration string. This avoids
       * reactivity issues where `rows` hasn't yet changed but something like workspaces has (stale values stored against fresh key)
       */
      sortGeneration:               undefined,
      listAutoRefreshToggleEnabled: paginationUtils.listAutoRefreshToggleEnabled({ rootGetters: this.$store.getters }),
      hasSearchFilter:              false,
      // Debounced emit of the server-side view filters (see serverViewFilters watcher)
      debouncedEmitViewFilters:     debounce((filters) => this.$emit('view-filters-changed', filters), 200),
      // Serialized form of the last emitted filters, to skip redundant emits. Starts as
      // the empty state so an initial empty query doesn't fire (matches the fallback path)
      lastViewFiltersKey:           '[]',
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
    },

    /**
     * When the server-side view filters change, tell the owning list to re-fetch. Compare
     * by serialized value so we don't emit on unrelated re-renders. Only fires while
     * server-side table views are active - the client-side fallback never emits.
     */
    'serverViewFilters.filters'(neu) {
      if (!this.serverSideTableViews) {
        return;
      }

      const filters = neu || [];
      const key = JSON.stringify(filters);

      if (key === this.lastViewFiltersKey) {
        return;
      }

      this.lastViewFiltersKey = key;
      this.debouncedEmitViewFilters(filters.length ? filters : []);
    },

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
      // :TableColumn[]
      let headers;
      const showNamespace = this.showNamespaceColumn;

      if ( this.headers ) {
        headers = this.headers.slice();
      } else {
        headers = this.$store.getters['type-map/headersFor'](this.schema, this.externalPaginationEnabled);
      }

      // add custom table columns provided by the extensions ExtensionPoint.TABLE_COL hook
      // gate it so that we prevent errors on older versions of dashboard
      if (this.$store.$extension?.getUIConfig) {
        // { column: TableColumn, paginationColumn: PaginationTableColumn }[]
        const extensionCols = getApplicableExtensionEnhancements(this, ExtensionPoint.TABLE_COL, TableColumnLocation.RESOURCE, this.$route);

        // adding extension defined cols to the correct header config
        extensionCols.forEach((config) => {
          let { column: col, paginationColumn } = config;

          if (this.externalPaginationEnabled) {
            if (paginationColumn) {
              // Use the pagination column, no need to
              col = paginationColumn;
            } else {
              // Attempt to fall back on the single column

              // validate that the required settings are supplied to enable search and sort server-side
              // these do not check other invalid scenarios like a path is a string but to a model property, or that the field supports sort/search via api (some basic non-breaking checks are done further on)
              if (
                col.search !== false && // search is explicitly disabled
                (typeof col.search !== 'string' && !Array.isArray(col.search)) && // primary property path to search on
                typeof col.value !== 'string' // secondary property path to search on
              ) {
                console.warn(`Unable to support server-side search for extension provided column "${ col.name || col.label || col.labelKey }" (column must provide \`search\` or \`value\` property containing a path to a property in the resource. search can be an array).`); // eslint-disable-line no-console

                col.search = false;
              }

              if (
                col.sort !== false && // sort is explicitly disabled
                (typeof col.sort !== 'string' && !Array.isArray(col.sort)) // primary property path to sort on
              ) {
                console.warn(`Unable to support server-side sort for extension provided column "${ col.name || col.label || col.labelKey }" (column must provide \`sort\` property containing a path to a property, or array of paths, in the resource)`); // eslint-disable-line no-console

                col.sort = false;
              }
            }
          }

          // we need the 'value' prop to be populated in order for the rows to show the values
          if (!col.value && col.getValue) {
            col.value = col.getValue;
          }

          // Establish a valid header position for the new table column
          let insertPosition = headers.length;

          if (headers.length > 0) {
            const ageColIndex = headers.findIndex((h) => h.name === AGE.name);

            if (ageColIndex >= 0) {
              // we will allow for the table col to be added right after the AGE col
              // but that will be the limit
              insertPosition = ageColIndex + 1;
            } else {
              // we've found some labels with ' ', which isn't necessarily empty (explore action/button)
              // if we are to add cols, let's push them before these so that the UI doesn't look weird
              const lastViableColIndex = headers.findIndex((h) => (!h.label || !h.label?.trim()) && (!h.labelKey || !h.labelKey?.trim()));

              if (lastViableColIndex >= 0) {
                insertPosition = lastViableColIndex;
              }
            }
          }

          // apply table col ordering if it's present on the new table col config
          if (col.weight) {
            if (col.weight < 0) {
              insertPosition = 0;
            } else if (col.weight < insertPosition) {
              insertPosition = col.weight;
            }
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

      let hideColumn;

      if (custom?.hideColumn) {
        hideColumn = custom.hideColumn;
      } else {
        const componentCustom = this.groupOptions?.find((go) => go.value === this.group);

        hideColumn = componentCustom?.hideColumn;
      }

      if (hideColumn) {
        const idx = headers.findIndex((header) => header.name === hideColumn);

        if ( idx >= 0 ) {
          headers.splice(idx, 1);
        }
      }

      return headers;
    },

    _applicableExtensionTableHooks() {
      if (this.$store.$extension?.getUIConfig) {
        const extensionTableHooks = getApplicableExtensionEnhancements(this, ExtensionPoint.TABLE, TableLocation.RESOURCE, this.$route);

        return extensionTableHooks;
      }

      return [];
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

    /**
     * Whether to show the table views toolbar above this table
     */
    showTableViews() {
      if (this.tableViews !== null) {
        return this.tableViews;
      }

      return !!this.schema?.id && !this.hasAdvancedFiltering && this.search;
    },

    /**
     * Everything the user can filter on, group by, or add as a column
     */
    viewFields() {
      return fieldsFor(this._headers, this.filteredRows, (key) => this.t(key));
    },

    /**
     * Fields offered in the group by menu.
     *
     * Grouping is really a sort, so server side it only works for fields the pagination api can
     * sort on. Offering the rest would silently group just the rows on the current page.
     */
    viewGroupFields() {
      if (!this.serverSideTableViews) {
        return this.viewFields;
      }
    
      return this.viewFields.filter((field) => {
        const path = serverPathFor(field);
    
        return typeof path === 'string' && stevePaginationUtils.isValidPaginationField(this.schema, path);
      });
    },

    viewTerms() {
      return parseQuery(this.view.query, this.viewFields);
    },

    /**
     * Should the toolbar filter run server-side (through the pagination `filter=` params)
     * rather than client-side? Only when the table is externally paginated and we know the
     * resource type (so we can validate fields against its schema)
     */
    serverSideTableViews() {
      return this.showTableViews && this.externalPaginationEnabled && !!this.schema;
    },

    /**
     * The view's query converted into steve/vai server filters (plus the terms that have
     * no server-side path). Empty when not running server-side
     */
    serverViewFilters() {
      if (!this.serverSideTableViews) {
        return { filters: [], unsupported: [] };
      }

      return termsToServerFilters(this.viewTerms, this.viewFields, { isAllowed: (p) => stevePaginationUtils.isValidPaginationField(this.schema, p) });
    },

    /**
     * Rows left once the view's query has been applied.
     *
     * Server-side: the rows are already filtered by the API, so pass them through. Client
     * side: apply the query in the browser.
     */
    viewRows() {
      if (this.serverSideTableViews) {
        return this.filteredRows;
      }

      if (!this.showTableViews || !this.viewTerms.length) {
        return this.filteredRows;
      }

      return applyQuery(this.filteredRows, this.viewTerms, this.viewFields);
    },

    /**
     * The number shown in the match-count pill. Server-side this is the server's total
     * count (across all pages), client-side it's the number of filtered rows
     */
    viewMatchCount() {
      if (this.serverSideTableViews) {
        return this.externalPaginationResult?.count ?? this.filteredRows.length;
      }

      return this.viewRows.length;
    },

    viewGroupField() {
      if (!this.showTableViews || !this.view.groupBy) {
        return null;
      }

      return findField(this.viewFields, this.view.groupBy) || null;
    },

    /**
     * The field path behind the view's group by.
     *
     * `computedGroupBy` is a function so it can render label values, and a function cannot
     * contribute to the sort - which is why grouping only rearranged the rows already on the
     * page. Handing the path over as `groupSort` puts it back into the sort, so the server
     * returns rows grouped across every page.
     */
    viewGroupSort() {
      const path = this.viewGroupField ? serverPathFor(this.viewGroupField) : null;
    
      return typeof path === 'string' ? path : null;
    },

    /**
     * The headers to show, after the view has hidden columns and added label columns
     */
    viewHeaders() {
      const headers = this._headers;

      if (!this.showTableViews) {
        return headers;
      }

      let out = headers;

      if (this.view.columns) {
        // Core columns are always kept, even if a saved or shared view omits them
        out = headers.filter((header) => isIgnoredColumn(header) || isCoreField(headerFieldId(header)) || !this.viewFields.find((f) => !f.isLabel && f.id === headerFieldId(header)) || this.view.columns.includes(headerFieldId(header)));
      }

      if (this.view.labelColumns?.length) {
        out = out.slice();

        // Put label columns after age, or at the end if there's no age column
        const ageIndex = out.findIndex((header) => header.name === AGE.name);
        const at = ageIndex >= 0 ? ageIndex : out.length;

        this.view.labelColumns.forEach((key, i) => {
          out.splice(at + i, 0, {
            name:   `${ LABEL_FIELD_PREFIX }${ key }`,
            label:  key,
            value:  (row) => row?.metadata?.labels?.[key] || '',
            sort:   false,
            search: false,
          });
        });
      }

      return out;
    },

    /**
     * Columns to write out when exporting
     */
    exportColumns() {
      return this.viewHeaders
        .filter((header) => !isIgnoredColumn(header) && (header.label || header.labelKey))
        .map((header) => {
          const label = header.label || this.t(header.labelKey);

          return {
            label,
            field: {
              id: headerFieldId(header), label, isLabel: false, header
            }
          };
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
        const exists = this._groupOptions.find((g) => g.value === this._group);

        if (!exists) {
          // Attempt to find the default option in available options...
          // if not use the first value in the options collection...
          // and if not that just fall back to the default
          if (this._groupOptions.find((g) => g.value === this.groupDefault)) {
            return this.groupDefault;
          }

          return this._groupOptions[0]?.value || this.groupDefault || DEFAULT_GROUP;
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

        return namespaceGroupable || customGroupable || this.groupOptions?.length;
      }

      return this.groupable || false;
    },

    computedGroupBy() {
      // A group chosen in the table views toolbar wins - it can be any field, including a label,
      // so the key is a function rather than a path
      if (this.viewGroupField) {
        const field = this.viewGroupField;
        const empty = this.t('tableViews.group.empty');

        return (row) => stringifyValue(fieldValue(row, field)) || empty;
      }

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

      const componentCustom = this.groupOptions?.find((go) => go.value === this.group);

      if (componentCustom?.field) {
        return componentCustom.field;
      }

      return null;
    },

    _groupOptions() {
      if (this.groupOptions) {
        return this.groupOptions;
      }

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

    /**
     * Readable, plural name of the resource being listed, used by the table to
     * describe the select all checkbox
     */
    selectAllLabel() {
      return this.parsedPagingParams.pluralLabel;
    },

    /**
     * Get the counts data by namespace for the current resource type
     */
    namespaceCounts() {
      if (!this.inStore || !this.schema?.id) {
        return {};
      }

      const counts = this.$store.getters[`${ this.inStore }/all`](COUNT)?.[0]?.counts || {};

      return counts[this.schema.id]?.namespaces || {};
    },

    /**
     * Whether we should show namespace counts in group tabs
     */
    showNamespaceCounts() {
      return (this.group === 'namespace' || this.group === 'metadata.namespace') && this.isNamespaced && !this.hasSearchFilter && !this.viewGroupField;
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
    },

    // this is where we handle the callbacks to the TABLE extension hooks
    handleSortableTableInteraction(arg) {
      if (this._applicableExtensionTableHooks?.length) {
        this._applicableExtensionTableHooks.forEach((item) => {
          if (item.tableHook) {
            item.tableHook(arg);
          }
        });
      }

      this.hasSearchFilter = !!arg?.filtering?.searchQuery;
    },

    /**
     * Export the rows for the requested scope in the requested format.
     *
     * Selection and page come from the table itself, everything else is what the view's
     * query has left us with.
     */
    handleExport({ format, scope }) {
      const table = this.$refs.table;
      let rows;

      if (scope === 'selection') {
        rows = table?.selectedRows || [];
      } else if (scope === 'page') {
        rows = table?.pagedRows || [];
      } else {
        rows = this.viewRows;
      }

      if (!rows.length) {
        return;
      }

      const columns = this.exportColumns;
      const name = (this.schema?.id || 'resources').replace(/[^a-z0-9]+/gi, '-');
      const content = format === 'json' ? rowsToJson(rows, columns) : rowsToCsv(rows, columns);
      const contentType = format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8';

      downloadFile(`${ name }-${ scope }.${ format }`, content, contentType);
    },
  }
};
</script>

<template>
  <SortableTable
    ref="table"
    v-bind="$attrs"
    :headers="viewHeaders"
    :rows="viewRows"
    :loading="loading"
    :alt-loading="altLoading"
    :group-by="computedGroupBy"
    :group-sort="viewGroupSort"
    :group="group"
    :group-options="_groupOptions"
    :search="showTableViews ? false : search"
    :header-right-fill="showTableViews"
    :paging="true"
    :paging-params="parsedPagingParams"
    :paging-label="pagingLabel"
    :select-all-label="selectAllLabel"
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
    @sortable-table-interaction="handleSortableTableInteraction"
  >
    <template
      v-if="showTableViews"
      #table-views
    >
      <TableViewsBar
        part="tabs"
        :view="view"
        :fields="viewFields"
        :group-fields="viewGroupFields"
        :rows="filteredRows"
        :match-count="viewMatchCount"
        :resource-type="schema ? schema.id : ''"
        :view-mode="group"
        :view-mode-options="showGrouping ? _groupOptions : []"
        @update:view="view = $event"
        @update:view-mode="group = $event"
        @export="handleExport"
      />
    </template>

    <template
      v-if="showGrouping && _groupOptions.length > 1 && !showTableViews"
      #header-middle
    >
      <slot name="more-header-middle" />

      <ButtonGroup
        v-model:value="group"
        :options="_groupOptions"
        size="medium"
      />
    </template>

    <template
      v-if="showGrouping || showTableViews"
      #header-right
    >
      <!-- In table-views mode the filter + single "View" popup live in the core masthead's
           search/right cell so they share the .fixed-header-actions grid row with .bulk. -->
      <TableViewsBar
        v-if="showTableViews"
        part="controls"
        :view="view"
        :fields="viewFields"
        :group-fields="viewGroupFields"
        :rows="filteredRows"
        :match-count="viewMatchCount"
        :resource-type="schema ? schema.id : ''"
        :view-mode="group"
        :view-mode-options="showGrouping ? _groupOptions : []"
        @update:view="view = $event"
        @update:view-mode="group = $event"
        @export="handleExport"
      />
      <slot
        name="header-right"
      />
    </template>

    <template
      v-if="externalPaginationEnabled"
      #watch-controls
    >
      <!-- See https://github.com/rancher/dashboard/issues/14359 -->
      <ToggleSwitch
        v-if="listAutoRefreshToggleEnabled"
        class="auto-update"
        :value="watching"
        name="label-system-toggle"
        :on-label="t('resourceTable.autoRefresh.label')"
        @update:value="toggleWatch"
      />
    </template>

    <template #group-by="{group: thisGroup}">
      <div class="group-tab">
        <span v-clean-html="thisGroup.ref" />
        <span
          v-if="showNamespaceCounts && Number.isInteger(namespaceCounts[thisGroup.rows?.[0]?.metadata?.namespace]?.count)"
          class="count"
        >
          ({{ namespaceCounts[thisGroup.rows?.[0]?.metadata?.namespace]?.count }})
        </span>
      </div>
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

<style lang="scss" scoped>
.auto-update {
  min-width: 150px; height: 40px
}

.group-tab .count {
  opacity: 0.7;
  margin-left: 2px;
}
</style>
