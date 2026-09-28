import debounce from 'lodash/debounce';

import { optionalHeadersFor } from '@shell/utils/table-views/optional-headers';
import { isImprovedTablesEnabled } from '@shell/utils/table-views/feature';
import { AGE } from '@shell/config/table-headers';
import { NotificationLevel } from '@shell/types/notifications';
import { downloadFile } from '@shell/utils/download';
import { exportColumnsFor, rowsToCsv, rowsToJson, rowsToYaml } from '@shell/utils/table-views/export';
import {
  LABEL_FIELD_PREFIX, coreFieldIdsFor, fieldsFor, findField, headerFieldId, isIgnoredColumn, serverPathFor, summaryToValues
} from '@shell/utils/table-views/fields';
import { applyQueryExpression } from '@shell/utils/table-views/filter-rows';
import { parseQuery, parseQueryExpression } from '@shell/utils/table-views/query';
import { queryToServerFilters } from '@shell/utils/table-views/server-filters';
import { SEARCH_DEBOUNCE } from '@shell/config/search';
import { TABLE_VIEWS } from '@shell/store/prefs';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { DEFAULT_MANDATORY_SORT } from '@shell/components/SortableTable/sorting';
import { sortBy } from '@shell/utils/sort';
import { uniq } from '@shell/utils/array';

/** Most rows an "all matching" export will fetch - a limit on what the browser holds, not on the api */
const EXPORT_ROW_LIMIT = 50000;

/** Lower for YAML, which is a request per resource and can't be called off once started */
const EXPORT_ROW_LIMIT_YAML = 10000;

/** Fetched a page at a time so there is progress to report */
const EXPORT_PAGE_SIZE = 1000;

const VIEW_SWITCH_TIMEOUT = 8000;

/** Marks a view's grouping as one of the table's own rather than a column */
export const TABLE_GROUPING_PREFIX = 'group:';

/**
 * The table views half of ResourceTable. Needs from its host: `schema`, `rows`, `headers`,
 * `namespaced`, `inStore`, `externalPaginationEnabled`, `externalPaginationResult`,
 * `externalPaginationArgs`, `externalPaginationScope`, `hasAdvancedFiltering`, `groupBy` and
 * `tableGroupings`
 */
export default {
  /** Supplied by pages that put tables under tabs of their own. The `tableViewTabs` prop still wins */
  inject: { providedShowTableViewTabs: { from: 'showTableViewTabs', default: null } },

  props: {
    /** Force the saved view tabs on or off. Null works it out - see showTableViewTabs */
    tableViewTabs: {
      type:    Boolean,
      default: null
    },

    /** Show the table views toolbar. Null means on for any table showing a known resource type */
    tableViews: {
      type:    Boolean,
      default: null,
    },
  },

  data() {
    /** @type {{ views: import('@shell/types/table-views').TableViewSaved[], defaultViewId: string|null }} */
    const saved = this.$store.getters['prefs/get'](TABLE_VIEWS)?.[this.schema?.id];
    /** @type {import('@shell/types/table-views').TableViewSaved|undefined} */
    const defaultView = (saved?.views || []).find((view) => view.id === saved?.defaultViewId);

    return {
      /**
       * Needed because an empty default holds what the All tab holds, and two views can hold the
       * same config
       */
      openedViewId: defaultView?.id,

      fieldValues: {},

      /** query -> rows matched, or null when the api wouldn't say */
      viewCounts: {},

      countingInFlight: false,

      view: {
        query:          defaultView?.query || '',
        columns:        defaultView?.columns || null,
        columnOrder:    defaultView?.columnOrder || null,
        labelColumns:   defaultView?.labelColumns || [],
        groupBy:        defaultView?.groupBy || null,
        sort:           defaultView?.sort || null,
        sortDescending: defaultView?.sortDescending || false,
      },

      /** Learned from the table's first sort report */
      defaultSort: null,

      /** What each tab is filtering by, including unsaved edits on tabs not in front */
      tabQueries: [],

      /**
       * The query the table acts on, which trails the one being typed: filtering, fetching and
       * counting are too expensive per keystroke. A saved view applied is flushed at once - see the
       * watcher
       */
      settledQuery: defaultView?.query || '',

      debouncedSettleQuery: debounce(function(query) {
        this.settledQuery = query;
      }, SEARCH_DEBOUNCE),

      appliedViewFilters: [],

      // Starts empty so an initial empty query doesn't emit
      lastViewFiltersKey: '[]',

      /**
       * From a view's filters changing until its rows arrive, so one view's rows never show under
       * another's columns. Also turns alt loading off, which would leave the old view's rows up
       */
      viewSwitching: false,

      viewSwitchTimer: null,

      pendingViewFilters: [],

      supersededViewFilters: [],


      debouncedFetchViewCounts: debounce(() => this.fetchViewCounts(), 800),

      debouncedRefreshViewCounts: debounce(() => this.fetchViewCounts(true), 400),
    };
  },

  mounted() {
    if (this.showTableViews) {
      this.debouncedFetchViewCounts();
    }
  },

  beforeUnmount() {
    clearTimeout(this.viewSwitchTimer);
    this.debouncedSettleQuery.cancel();
  },

  watch: {
    /** Cached suggestions belong to the old scope */
    summaryBaseUrl(neu, old) {
      if (neu === old) {
        return;
      }

      // Re-fetched rather than dropped, or the input falls back to display values ("Active" rather
      // than "active")
      const known = Object.keys(this.fieldValues);

      this.fieldValues = {};
      known.forEach((fieldId) => this.fetchFieldValues(fieldId));
    },

    viewCountsKey() {
      this.debouncedFetchViewCounts();
    },

    /**
     * The only time every count is retaken. Not tied to the rows, which would blink counts to zero
     * on every fetch
     */
    viewCountsScope() {
      this.debouncedRefreshViewCounts();
    },

    'serverViewFilters.filters'(neu) {
      if (!this.serverSideTableViews) {
        return;
      }

      const filters = neu || [];
      const key = JSON.stringify(filters);

      if (key === this.lastViewFiltersKey) {
        return;
      }

      this.supersededViewFilters = this.pendingViewFilters;
      this.pendingViewFilters = filters;
      this.lastViewFiltersKey = key;
      this.beginViewSwitch();
      this.appliedViewFilters = filters.length ? filters : [];
    },

    /**
     * Only typing waits. A query arriving whole (a saved view) doesn't, and typing only changes the
     * end, so one query starting with the other tells the two apart
     */
    'view.query'(neu, old) {
      const query = neu || '';
      const previous = old || '';
      const typed = query.startsWith(previous) || previous.startsWith(query);

      this.debouncedSettleQuery(query);

      if (!typed) {
        this.debouncedSettleQuery.flush();
      }
    },

    /** Wait for the api's regrouped rows rather than regrouping the ones in hand and being corrected after */
    viewGroupSort(neu, old) {
      if (this.serverSideTableViews && neu !== old) {
        this.beginViewSwitch();
      }
    },

    'view.sort'() {
      this.$nextTick(() => this.applyViewSort());
    },

    'view.sortDescending'() {
      this.$nextTick(() => this.applyViewSort());
    },

    /** Hiding the column a view sorts by returns the table to its default sort */
    viewHeaders() {
      this.$nextTick(() => this.applyViewSort());
    },

    /**
     * Only the response this view asked for ends the wait; one already in flight answers first.
     * Watched rather than `rows`, which is filled in place and never changes identity
     */
    externalPaginationResult() {
      if (this.viewFiltersApplied) {
        this.endViewSwitch();
      }
    },
  },

  computed: {
    /**
     * The flag is asked first: a page turning the toolbar on can't overrule an administrator
     * turning it off
     */
    showTableViews() {
      if (!isImprovedTablesEnabled(this.$store)) {
        return false;
      }

      if (this.tableViews !== null) {
        return this.tableViews;
      }

      return !!this.schema?.id && !this.hasAdvancedFiltering;
    },


    /**
     * Saved views are per type, so they don't belong above a table that lists one resource's things
     * (eg a deployment's pods). A detail route names a resource; a list route doesn't
     */
    showTableViewTabs() {
      if (this.tableViewTabs !== null) {
        return this.tableViewTabs;
      }

      if (!this.showTableViews) {
        return false;
      }

      // The cluster dashboard is routed by cluster, so its tables would look like list pages
      if (this.providedShowTableViewTabs !== null) {
        return this.providedShowTableViewTabs;
      }

      // Only the id: the cluster list is routed by the provisioning type while its table has the
      // management one
      return !this.$route?.params?.id;
    },


    /**
     * Every column the type has, not just the page's. The page's headers keep their order; the
     * type's others are added after the last data column
     */
    availableHeaders() {
      const own = this._headers || [];

      if (!this.schema) {
        return own;
      }

      const known = {};

      own.forEach((header) => {
        known[headerFieldId(header)] = true;
      });

      const fromType = this.headers ? this.$store.getters['type-map/headersFor'](this.schema, this.externalPaginationEnabled) : [];
      const extra = fromType
        .concat(optionalHeadersFor(this.schema.id, this.$store, this.externalPaginationEnabled))
        .filter((header) => {
          const id = headerFieldId(header);

          if (isIgnoredColumn(header) || known[id]) {
            return false;
          }

          known[id] = true;

          return true;
        });

      if (!extra.length) {
        return own;
      }

      let at = own.length;

      for (let i = own.length - 1; i >= 0; i--) {
        if (!isIgnoredColumn(own[i])) {
          at = i + 1;
          break;
        }
      }

      const out = own.slice(0, at).concat(extra.filter((header) => !header.insertBefore), own.slice(at));

      extra.filter((header) => header.insertBefore).forEach((header) => {
        const index = out.findIndex((existing) => existing.name === header.insertBefore);

        out.splice(index >= 0 ? index : at, 0, header);
      });

      return out;
    },


    defaultColumnIds() {
      return (this._headers || []).filter((header) => !isIgnoredColumn(header)).map((header) => headerFieldId(header));
    },


    defaultSortColumnId() {
      const header = (this._headers || []).find((h) => h.defaultSort);

      return header ? headerFieldId(header) : null;
    },


    coreColumnIds() {
      return coreFieldIdsFor(this.defaultColumnIds, this.defaultSortColumnId);
    },


    /**
     * The columns as the pagination api defines them, or null when the list isn't paginated - see
     * serverPathFor
     */
    paginationHeaders() {
      if (!this.externalPaginationEnabled || !this.schema) {
        return null;
      }

      return this.$store.getters['type-map/headersFor'](this.schema, true)
        .concat(optionalHeadersFor(this.schema.id, this.$store, true));
    },


    viewFields() {
      return fieldsFor(this.availableHeaders, this.filteredRows, (key) => this.t(key), this.paginationHeaders);
    },


    /** `header-right` is left out: this renders its own there, and a duplicate would win */
    passthroughSlots() {
      const { 'header-right': headerRight, ...rest } = this.$slots;

      // A page's own group heading is drawn for its own grouping, not for a column's
      if (this.viewGroupField) {
        delete rest['group-by'];
      }

      return (this.showGrouping || this.showTableViews) ? rest : this.$slots;
    },


    /**
     * The table's own groupings, then the columns the table can sort by - so the group menu and the
     * sortable headers always agree. A column one of those groupings already covers is left out
     */
    viewGroupFields() {
      const own = this.tableGroupings.map((option) => ({
        id:      `${ TABLE_GROUPING_PREFIX }${ option.value }`,
        label:   this.tableGroupingLabel(option),
        isLabel: false,
      }));
      const covered = this.tableGroupings.flatMap((option) => [option.hideColumn, option.field]).filter(Boolean);

      return own.concat(this.viewFields.filter((field) => {
        if (field.isLabel) {
          return true;
        }

        const { header } = field;

        if (!header?.sort || covered.includes(header.name) || covered.includes(header.value)) {
          return false;
        }

        return typeof header.value === 'function' || !!header.value ||
          typeof header.sort === 'string' || (Array.isArray(header.sort) && typeof header.sort[0] === 'string');
      }));
    },

    /** The table's own grouping the view has picked, if it picked one */
    viewTableGrouping() {
      return this.tableGroupings.find((option) => `${ TABLE_GROUPING_PREFIX }${ option.value }` === this.view.groupBy) || null;
    },



    /** Server side, only the fields the api indexes, so nothing is suggested that would then be ignored */
    viewFilterFields() {
      // Labels are filterable, but the rows in hand are the only way to list their keys, and that
      // list empties as you type. So they are typed rather than offered
      const suggestable = this.viewFields.filter((field) => !field.isLabel);

      if (!this.serverSideTableViews) {
        return suggestable;
      }

      return suggestable.filter((field) => {
        const raw = serverPathFor(field);
        const paths = Array.isArray(raw) ? raw : [raw];

        return paths.some((path) => typeof path === 'string' && stevePaginationUtils.isValidPaginationField(this.schema, path));
      });
    },


    viewTerms() {
      return parseQuery(this.settledQuery, this.viewFields);
    },


    /** The query as clauses and groups - what filters, here and at the api */
    viewQuery() {
      return parseQueryExpression(this.settledQuery, this.viewFields);
    },


    serverSideTableViews() {
      return this.showTableViews && this.externalPaginationEnabled && !!this.schema;
    },


    /** Is every filter this view wants applied, and none it replaced? */
    viewFiltersApplied() {
      const applied = (this.externalPaginationArgs?.filters || []).map((filter) => JSON.stringify(filter));
      const wanted = (this.pendingViewFilters || []).map((filter) => JSON.stringify(filter));
      const superseded = (this.supersededViewFilters || []).map((filter) => JSON.stringify(filter));

      return wanted.every((filter) => applied.includes(filter)) &&
        !superseded.some((filter) => !wanted.includes(filter) && applied.includes(filter));
    },


    serverViewFilters() {
      if (!this.serverSideTableViews) {
        return { filters: [], unsupported: [] };
      }

      return queryToServerFilters(this.viewQuery, this.viewFields, { isAllowed: (p) => stevePaginationUtils.isValidPaginationField(this.schema, p) });
    },


    /** Names of the query's fields this list can't filter by, which are dropped rather than applied */
    unsupportedViewFields() {
      const seen = {};

      (this.serverViewFilters.unsupported || []).forEach((term) => {
        const field = term.field ? findField(this.viewFields, term.field) : null;
        const label = field ? (field.label || field.id) : term.value;

        if (label) {
          seen[label] = true;
        }
      });

      return Object.keys(seen);
    },

    /** The list's own filters without the view's. Compared by value: they are rebuilt every render */
    listScopeFilters() {
      if (this.externalPaginationScope) {
        return this.externalPaginationScope.filters || [];
      }

      // No explicit scope, from an older caller
      const args = this.externalPaginationArgs;

      if (!args?.filters?.length) {
        return [];
      }

      const own = this.serverViewFilters.filters.map((filter) => JSON.stringify(filter));

      return args.filters.filter((filter) => !own.includes(JSON.stringify(filter)));
    },


    listScopeNamespaces() {
      return this.externalPaginationScope?.projectsOrNamespaces || this.externalPaginationArgs?.projectsOrNamespaces || [];
    },


    summaryBaseUrl() {
      const urlFor = this.$store.getters[`${ this.inStore }/urlFor`];
      const args = this.externalPaginationArgs;

      if (!args) {
        return urlFor(this.schema.id);
      }

      // No page: `summaryonly` still aggregates over the page window
      return urlFor(this.schema.id, null, {
        pagination: {
          filters:              this.listScopeFilters,
          projectsOrNamespaces: this.listScopeNamespaces,
        }
      });
    },


    viewRows() {
      if (this.serverSideTableViews) {
        return this.filteredRows;
      }

      if (!this.showTableViews || !this.viewTerms.length) {
        return this.filteredRows;
      }

      return applyQueryExpression(this.filteredRows, this.viewQuery, this.viewFields);
    },


    /** The server's total across pages, or the filtered rows client side */
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
     * The path behind the view's grouping. `computedGroupBy` is a function, which can't join the
     * sort, so this puts the grouping into the server's sort
     */
    viewGroupSort() {
      return (this.viewGroupField && this.groupSortFor(this.viewGroupField)) || this.groupSort;
    },


    viewHeaders() {
      return this.headersForView(this.view);
    },


    savedViews() {
      const stored = this.$store.getters['prefs/get'](TABLE_VIEWS)?.[this.schema?.id];

      // The first shape views were kept in
      return Array.isArray(stored) ? stored : stored?.views || [];
    },

    /** Queries rather than views: two views filtering alike share one count */
    countableQueries() {
      const out = ['']
        .concat(this.savedViews.map((view) => view.query || ''))
        .concat([this.view.query || ''])
        // A tab with unsaved edits is filtering by them, not its saved query
        .concat(this.tabQueries);

      return Array.from(new Set(out));
    },


    viewCountsKey() {
      return JSON.stringify(this.countableQueries);
    },


    viewCountsScope() {
      return JSON.stringify(this.listScopeFilters) + JSON.stringify(this.listScopeNamespaces);
    },


    localViewCounts() {
      const out = {};

      this.countableQueries.forEach((query) => {
        const parsed = parseQueryExpression(query, this.viewFields);

        out[query] = parsed.clauses.length ? applyQueryExpression(this.filteredRows, parsed, this.viewFields).length : this.filteredRows.length;
      });

      return out;
    },


    tabCounts() {
      return this.serverSideTableViews ? this.viewCounts : this.localViewCounts;
    },


    exportColumns() {
      return exportColumnsFor(this.viewHeaders, (key) => this.t(key));
    },
  },

  methods: {
    /** A short name for one of the table's own groupings: its `labelKey`, else the one matching its tooltip */
    tableGroupingLabel(option) {
      const short = option.labelKey || option.tooltipKey?.replace(/^resourceTable\.groupBy\./, 'tableViews.group.by.');

      if (short && this.$store.getters['i18n/exists'](short)) {
        return this.t(short);
      }

      return option.tooltipKey ? this.t(option.tooltipKey) : (option.tooltip || option.value);
    },

    /** A method as well as a computed, so a tab exported from its own menu gets its own headers */
    headersForView(view) {
      const headers = this._headers;

      if (!this.showTableViews) {
        return headers;
      }

      let out = headers;

      if (view.columns) {
        // From everything the type has, so the page's left out columns can be added. Core columns
        // always stay
        out = this.availableHeaders.filter((header) => isIgnoredColumn(header) || this.coreColumnIds.includes(headerFieldId(header)) || !this.viewFields.find((f) => !f.isLabel && f.id === headerFieldId(header)) || view.columns.includes(headerFieldId(header)));
      }

      if (view.columnOrder?.length) {
        // Only data columns move; `check`, `actions` and the rest stay put
        const order = view.columnOrder;
        const movable = out.filter((header) => !isIgnoredColumn(header) && order.includes(headerFieldId(header)));
        const sorted = movable.slice().sort((a, b) => order.indexOf(headerFieldId(a)) - order.indexOf(headerFieldId(b)));
        let next = 0;

        out = out.map((header) => (movable.includes(header) ? sorted[next++] : header));
      }

      if (view.labelColumns?.length) {
        out = out.slice();

        const ageIndex = out.findIndex((header) => header.name === AGE.name);
        const at = ageIndex >= 0 ? ageIndex : out.length;

        view.labelColumns.forEach((key, i) => {
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
     * The column's own sort path, so grouping orders rows as sorting by it would. Later `sort`
     * entries are tie breakers, and may carry `:desc`
     */
    groupSortFor(field) {
      const sort = field?.header?.sort;
      const first = Array.isArray(sort) ? sort[0] : sort;

      if (typeof first === 'string' && first) {
        return first.split(':')[0];
      }

      // Labels have no header, and some columns say nothing about sorting
      const path = field ? serverPathFor(field) : null;

      return typeof path === 'string' ? path : null;
    },


    /** Values in use for a field, from a steve summary: it counts every row without returning any */
    async fetchFieldValues(fieldId) {
      if (!this.serverSideTableViews || this.fieldValues[fieldId] !== undefined) {
        return;
      }

      const field = findField(this.viewFields, fieldId);
      const path = field ? serverPathFor(field) : null;

      if (typeof path !== 'string' || !stevePaginationUtils.isValidPaginationField(this.schema, path)) {
        // Claimed anyway, so the input stops asking and falls back to the page
        this.fieldValues = { ...this.fieldValues, [fieldId]: [] };

        return;
      }

      this.fieldValues = { ...this.fieldValues, [fieldId]: [] };

      try {
        const url = `${ this.summaryBaseUrl }&summary=${ encodeURIComponent(path) }&summaryonly`;
        const res = await this.$store.dispatch(`${ this.inStore }/request`, { opt: { url } });

        this.fieldValues = { ...this.fieldValues, [fieldId]: summaryToValues(res) };
      } catch (e) {
        this.fieldValues = { ...this.fieldValues, [fieldId]: [] };
      }
    },


    /**
     * Count each saved view's rows for its tab. Views the api can't express get no count rather
     * than a wrong one
     */
    async fetchViewCounts(refresh = false) {
      if (!this.serverSideTableViews) {
        return;
      }

      // A count stays until a fresh one replaces it, so none blink to zero
      const wanted = this.countableQueries.filter((query) => refresh || this.viewCounts[query] === undefined);

      // One round at a time, or mid-flight triggers ask again and supersede their own requests
      if (!wanted.length || this.countingInFlight) {
        return;
      }

      this.countingInFlight = true;

      try {
        await this.requestViewCounts(wanted);
      } finally {
        this.countingInFlight = false;
      }
    },


    async requestViewCounts(wanted) {
      await Promise.all(wanted.map(async(query) => {
        const parsed = parseQueryExpression(query, this.viewFields);
        const { filters, unsupported } = queryToServerFilters(parsed, this.viewFields, { isAllowed: (p) => stevePaginationUtils.isValidPaginationField(this.schema, p) });

        if (unsupported.length) {
          this.viewCounts = { ...this.viewCounts, [query]: null };

          return;
        }

        try {
          const url = this.countUrl(filters);
          const res = await this.$store.dispatch(`${ this.inStore }/request`, { opt: { url } });
          const count = res?.count ?? res?.data?.length;

          if (count !== undefined) {
            this.viewCounts = { ...this.viewCounts, [query]: count };
          }
        } catch (e) {
          // Recorded as unanswerable, or every later trigger retries it
          this.viewCounts = { ...this.viewCounts, [query]: null };
        }
      }));
    },


    countUrl(filters) {
      const urlFor = this.$store.getters[`${ this.inStore }/urlFor`];

      return urlFor(this.schema.id, null, {
        pagination: {
          filters:              (this.listScopeFilters || []).concat(filters),
          projectsOrNamespaces: this.listScopeNamespaces,
          page:                 1,
          pageSize:             1,
        }
      });
    },


    /** The table's first report is its own default, kept so matching it is stored as no sort */
    recordSort(sorting) {
      if (!this.showTableViews || !sorting?.sortBy) {
        return;
      }

      const { sortBy, descending } = sorting;

      // A view sorting by a hidden column keeps asking; the fallback is not an edit
      const wanted = this.view.sort;

      if (wanted && !this.viewHeaders.some((header) => header.name === wanted)) {
        return;
      }

      // The table obliged; recording it as "no sort" would mark the view changed
      if (wanted === sortBy && !!this.view.sortDescending === !!descending) {
        return;
      }

      if (!this.defaultSort) {
        this.defaultSort = { sortBy, descending: !!descending };

        // The first report predates the view's sort being applied
        if (wanted && wanted !== sortBy) {
          return;
        }
      }

      const isDefault = sortBy === this.defaultSort.sortBy && !!descending === this.defaultSort.descending;
      const sort = isDefault ? null : sortBy;

      if ((this.view.sort || null) === sort && !!this.view.sortDescending === !!descending) {
        return;
      }

      this.view = {
        ...this.view, sort, sortDescending: !!descending
      };
    },


    applyViewSort() {
      const table = this.$refs.table;

      if (!table || !this.defaultSort) {
        return;
      }

      const wanted = this.view.sort;
      const shown = wanted && this.viewHeaders.some((header) => header.name === wanted);
      const sortBy = shown ? wanted : this.defaultSort.sortBy;
      const descending = shown ? !!this.view.sortDescending : this.defaultSort.descending;

      if (table.sortBy === sortBy && !!table.descending === descending) {
        return;
      }

      table.changeSort(sortBy, descending);
    },


    /**
     * Every row the current filter matches, not just the page on screen
     *
     * @param onProgress called with (done, total) after each page arrives
     * @param limit most rows to fetch
     */
    async allMatchingRows(onProgress, limit = EXPORT_ROW_LIMIT) {
      if (!this.externalPaginationEnabled || !this.externalPaginationArgs || !this.schema) {
        return this.viewRows;
      }

      // Whatever arrived before a failure is still written; only an export that got nowhere falls
      // back
      return this.fetchEveryPage(this.externalPaginationArgs, onProgress, limit, () => this.viewRows);
    },


    /**
     * Every row a request matches, a page at a time. `transient`, so the store and the table are
     * left alone, and pinned to the first page's revision so no row is dropped or repeated between
     * pages
     *
     * @param pagination what to ask for; the page and its size are filled in here
     * @param onProgress called with (done, total) after each page arrives
     * @param limit most rows to fetch
     * @param fallback answered if the first page fails; without one the failure is thrown
     */
    async fetchEveryPage(pagination, onProgress, limit, fallback) {
      const rows = [];
      let total = null;
      let revision;

      try {
        for (let page = 1; rows.length < limit; page++) {
          const res = await this.$store.dispatch(`${ this.inStore }/findPage`, {
            type: this.schema.id,
            opt:  {
              transient:  true,
              watch:      false,
              revision,
              pagination: {
                ...pagination,
                page,
                pageSize: EXPORT_PAGE_SIZE,
              },
            }
          });

          const data = res?.data || [];

          rows.push(...data);

          if (total === null) {
            total = Math.min(res?.pagination?.result?.count ?? data.length, limit);
            revision = res?.pagination?.result?.revision;
          }

          onProgress?.(Math.min(rows.length, total), total);

          // A short page is the end, whatever the count said
          if (data.length < EXPORT_PAGE_SIZE || rows.length >= total) {
            break;
          }
        }
      } catch (e) {
        if (!rows.length) {
          if (fallback) {
            return fallback();
          }

          throw e;
        }
      }

      return rows;
    },


    /** The rows a tab not on screen matches, worked out as opening it would, in its order */
    async rowsForView(view, onProgress, limit) {
      const parsed = parseQueryExpression(view.query || '', this.viewFields);
      let rows;

      if (this.serverSideTableViews) {
        // Terms the api can't answer are left out, as they are when the tab is open
        const { filters } = queryToServerFilters(parsed, this.viewFields, { isAllowed: (p) => stevePaginationUtils.isValidPaginationField(this.schema, p) });

        rows = await this.fetchEveryPage({
          filters:              (this.listScopeFilters || []).concat(filters),
          projectsOrNamespaces: this.listScopeNamespaces,
          sort:                 [],
        }, onProgress, limit);
      } else {
        rows = parsed.clauses.length ? applyQueryExpression(this.filteredRows, parsed, this.viewFields) : this.filteredRows;
      }

      return this.orderRowsFor(view, rows);
    },


    /**
     * In the order the table would show `view`: its grouping, its sort column (or the table's
     * default), then the tie breakers
     */
    orderRowsFor(view, rows) {
      const headers = this.headersForView(view);
      const own = !!view.sort && headers.some((header) => header?.name === view.sort);
      const sortName = own ? view.sort : this.defaultSort?.sortBy;
      const descending = own ? !!view.sortDescending : !!this.defaultSort?.descending;
      const column = sortName ? headers.find((header) => header?.name?.toLowerCase() === sortName.toLowerCase()) : null;
      const fromColumn = typeof column?.sort === 'string' || Array.isArray(column?.sort) ? [].concat(column.sort) : [];
      const group = view.groupBy ? this.groupSortFor(findField(this.viewFields, view.groupBy)) : null;
      const fields = uniq([].concat(group || [], fromColumn).concat(this._mandatorySort || DEFAULT_MANDATORY_SORT));

      return sortBy(rows, fields, descending);
    },


    beginViewSwitch() {
      this.viewSwitching = true;
      clearTimeout(this.viewSwitchTimer);
      this.viewSwitchTimer = setTimeout(() => {
        this.viewSwitching = false;
      }, VIEW_SWITCH_TIMEOUT);
    },


    endViewSwitch() {
      if (!this.viewSwitching) {
        return;
      }

      clearTimeout(this.viewSwitchTimer);
      this.viewSwitching = false;
    },


    /**
     * Export every row the view matches, tracked as a task in the notification centre. The store is
     * dispatched to directly: the shell api can't turn a task into a success
     *
     * @param {{ format: string, name: string, view?: Partial<import('@shell/types/table-views').TableViewState> }} args
     *   `view` is a tab other than the one on screen
     */
    async handleExport({ format, name, view }) {
      const viewName = name || this.t('tableViews.tabs.all');
      const id = await this.$store.dispatch('notifications/add', {
        level:    NotificationLevel.Task,
        title:    this.t('tableViews.export.notification.title'),
        message:  this.t('tableViews.export.notification.message', { name: viewName, format: (format || '').toUpperCase() }),
        progress: 0,
      });

      // How much of the progress bar fetching takes; YAML still has a request per resource to come
      const fetchShare = format === 'yaml' ? 20 : 90;
      const report = (done, total, from, to) => {
        this.$store.dispatch('notifications/update', { id, progress: Math.round(from + (((to - from) * done) / (total || 1))) });
      };

      try {
        const limit = format === 'yaml' ? EXPORT_ROW_LIMIT_YAML : EXPORT_ROW_LIMIT;
        const onFetch = (done, total) => report(done, total, 0, fetchShare);
        const rows = view ? await this.rowsForView(view, onFetch, limit) : await this.allMatchingRows(onFetch, limit);

        if (!rows.length || !format) {
          return this.$store.dispatch('notifications/remove', id);
        }

        const columns = view ? exportColumnsFor(this.headersForView(view), (key) => this.t(key)) : this.exportColumns;
        const file = await this.writeExport(rows, format, (done, total) => report(done, total, fetchShare, 100), columns);

        return this.$store.dispatch('notifications/update', {
          id,
          level:    NotificationLevel.Success,
          title:    this.t('tableViews.export.notification.doneTitle'),
          message:  this.t('tableViews.export.notification.doneMessage', { name: viewName, file }),
          progress: 100,
        });
      } catch (e) {
        console.error('Unable to export the view', e); // eslint-disable-line no-console

        return this.$store.dispatch('notifications/update', {
          id,
          level:   NotificationLevel.Error,
          title:   this.t('tableViews.export.notification.failedTitle'),
          message: this.t('tableViews.export.notification.failedMessage', { name: viewName }),
        });
      }
    },


    /**
     * Write the rows to a file and download it. YAML is the resources themselves, via the Download
     * YAML action
     */
    async writeExport(rows, format, onProgress, columns = this.exportColumns) {
      if (format === 'yaml' && typeof rows[0]?.downloadYaml === 'function') {
        if (rows.length === 1) {
          await rows[0].downloadYaml();

          return `${ rows[0].nameDisplay }.yaml`;
        }

        await rows[0].downloadYamlBulk(rows, onProgress);

        return 'resources.zip';
      }

      const name = (this.schema?.id || 'resources').replace(/[^a-z0-9]+/gi, '-');
      const writers = {
        yaml: { write: rowsToYaml, type: 'application/yaml;charset=utf-8' },
        json: { write: rowsToJson, type: 'application/json;charset=utf-8' },
        csv:  { write: rowsToCsv, type: 'text/csv;charset=utf-8' },
      };
      const writer = writers[format] || writers.csv;
      const file = `${ name }.${ format }`;

      await downloadFile(file, writer.write(rows, columns), writer.type);

      return file;
    },
  },
};
