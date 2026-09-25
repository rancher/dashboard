import debounce from 'lodash/debounce';

import { optionalHeadersFor } from '@shell/config/optional-table-headers';
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
import { decodeView } from '@shell/utils/table-views/views';
import { SEARCH_DEBOUNCE } from '@shell/config/search';
import { TABLE_VIEWS } from '@shell/store/prefs';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';

/**
 * Most rows an "all matching" export will fetch.
 *
 * A filter can match an entire cluster's worth of resources. A list that is not paginated already
 * fetches every one of them, so the ceiling here is about what the browser will hold and write,
 * not about sparing the api.
 */
const EXPORT_ROW_LIMIT = 50000;

/**
 * The same, for YAML.
 *
 * YAML is the resources themselves, which is a request each rather than a page of a thousand - so
 * the wait grows with the rows in a way the other formats' does not, and there is no way to call
 * one off once it has started.
 */
const EXPORT_ROW_LIMIT_YAML = 10000;

/**
 * How many rows an "all matching" export asks for at a time.
 *
 * The rows could be fetched in one request, but then there would be nothing to report while it
 * ran - and this is the part of an export that keeps the user waiting.
 */
const EXPORT_PAGE_SIZE = 1000;

/** How long the table will wait for a view's rows before showing what it has anyway */
const VIEW_SWITCH_TIMEOUT = 8000;

/**
 * Everything a resource table needs to carry the table views toolbar: the view the user is
 * looking at, the fields the toolbar offers, the rows and columns the view leaves, the counts on
 * its tabs, and the export it can start.
 *
 * Kept apart from the table itself because it is one concern with a seam of its own - the table
 * hands it `rows`, `headers` and its schema, and takes back what to show. A table that wants
 * none of it passes `:table-views="false"` and none of this does anything.
 *
 * It expects the component it is mixed into to supply, as props or data: `schema`, `rows`,
 * `headers`, `namespaced`, `inStore`, `externalPaginationEnabled`, `externalPaginationResult`,
 * `externalPaginationArgs`, `externalPaginationScope`, `hasAdvancedFiltering` and `groupBy` -
 * which is what @shell/components/ResourceTable has.
 */
export default {
  /**
   * The default for the saved view tabs, supplied by a page that puts tables under tabs of its own
   * - ResourceTabs, and the cluster dashboard, which builds its tabs from Tabbed directly. The
   * `tableViewTabs` prop still wins over it. See showTableViewTabs.
   */
  inject: { providedShowTableViewTabs: { from: 'showTableViewTabs', default: null } },

  props: {
    /**
     * Force the saved view tabs on or off. Null works it out - see showTableViewTabs
     */
    tableViewTabs: {
      type:    Boolean,
      default: null
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
    // A shared view can arrive in the url, eg ?view=<encoded>. Failing that the user may have
    // marked one of their saved views as the one this list opens on.
    const saved = this.$store.getters['prefs/get'](TABLE_VIEWS)?.[this.schema?.id];
    const shared = decodeView(this.$route?.query?.view) ||
      (saved?.views || []).find((view) => view.id === saved?.defaultViewId) ||
      null;

    return {
      /** fieldId -> values in use, fetched from the api by fetchFieldValues */
      fieldValues: {},

      /** query -> how many rows it matches, or null when the api wouldn't say. Shown on the tabs */
      viewCounts: {},

      /** True while a round of counts is out, so triggers don't stack up on top of each other */
      countingInFlight: false,

      view: {
        query:          shared?.query || '',
        columns:        shared?.columns || null,
        columnOrder:    shared?.columnOrder || null,
        labelColumns:   shared?.labelColumns || [],
        groupBy:        shared?.groupBy || null,
        sort:           shared?.sort || null,
        sortDescending: shared?.sortDescending || false,
      },

      /** The sort the table falls back to, learned from it the first time it reports one */
      defaultSort: null,

      /** What each tab is filtering by, the edits held for tabs not in front of the user included */
      tabQueries: [],

      /**
       * The query the table acts on, which trails the one being typed.
       *
       * Everything downstream of this is expensive - the rows re-filtered and re-drawn, a request
       * to the api, a count fetched for every tab - and doing all of it per keystroke turned
       * typing into a series of jolts. The box itself is not held back: what you type appears at
       * once, and so do its suggestions. This is only how long the table waits before answering.
       *
       * Picking a saved view is a single act with nothing following it, so that flushes instead
       * of waiting - see the watcher.
       */
      settledQuery: shared?.query || '',

      debouncedSettleQuery: debounce(function(query) {
        this.settledQuery = query;
      }, SEARCH_DEBOUNCE),

      /** The filters handed down to the table, worked out from the settled query */
      appliedViewFilters: [],

      // Serialized form of the last emitted filters, to skip redundant emits. Starts as
      // the empty state so an initial empty query doesn't fire (matches the fallback path)
      lastViewFiltersKey: '[]',
      // Counting every saved view costs one (tiny) request each, so it waits for the list to
      // settle rather than running on each row that arrives,

      /**
       * True from the moment a view's filters change until its rows have come back. The view's
       * columns and grouping apply the instant it is picked, but its rows are a request away, so
       * without this the table spends that time showing one view's data under another's columns.
       *
       * It also turns alt loading off while it lasts. Alt loading leaves the rows up while it
       * waits, which is right for refreshing the same list and wrong here - the rows still up
       * are the ones being navigated away from.
       */
      viewSwitching: false,

      viewSwitchTimer: null,

      /** The view filters the table is waiting to see applied, and the ones it is waiting to lose */
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
    /**
     * Suggested values are cached per field, so they have to be dropped when the list's scope
     * changes - switching the namespace filter otherwise kept offering values from the namespaces
     * the user has just navigated away from
     */
    summaryBaseUrl(neu, old) {
      if (neu === old) {
        return;
      }

      // Re-fetch rather than just drop them. Clearing alone left the input quietly falling back
      // to scanning the page, which offers the value a column *shows* ("Active") in place of the
      // one a query has to use ("active")
      const known = Object.keys(this.fieldValues);

      this.fieldValues = {};
      known.forEach((fieldId) => this.fetchFieldValues(fieldId));
    },

    /**
     * A new tab, or a new query in the box, needs a count of its own. Debounced, so typing a
     * query asks once it is finished rather than once per keystroke.
     */
    viewCountsKey() {
      this.debouncedFetchViewCounts();
    },

    /**
     * The same query counts differently in another namespace, so every count is taken again -
     * the only time they are. Deliberately not tied to the rows: a count that moved with the
     * table would blink to zero every time the list went to fetch a page.
     */
    viewCountsScope() {
      this.debouncedRefreshViewCounts();
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

      this.supersededViewFilters = this.pendingViewFilters;
      this.pendingViewFilters = filters;
      this.lastViewFiltersKey = key;
      this.beginViewSwitch();
      // No wait of its own: these are worked out from `settledQuery`, so by the time they change
      // the typing they came from has already stopped.
      this.appliedViewFilters = filters.length ? filters : [];
    },

    /**
     * Hold what is typed back from the table for a moment - see `settledQuery`.
     *
     * Only what was typed. A query arriving whole - a saved view applied, a shared one from the
     * url - is a single act with nothing following it, and waiting on it would leave the tab
     * underlined before its rows had been asked for. Typing only ever adds to or takes from the
     * end, so one query being the start of the other is what tells the two apart.
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

    /**
     * Changing the grouping re-sorts the whole set at the api, so the table waits for those rows
     * rather than regrouping the ones it already has and then being corrected a moment later.
     * Picking a grouping showed two arrangements in a row, neither of them asked for.
     *
     * Ended by the same watcher that ends a filter switch - the filters have not moved, so the
     * next response to land is the one this asked for.
     */
    viewGroupSort(neu, old) {
      if (this.serverSideTableViews && neu !== old) {
        this.beginViewSwitch();
      }
    },

    /** A view naming a sort, or losing the column it named, puts the table on the right one */
    'view.sort'() {
      this.$nextTick(() => this.applyViewSort());
    },

    'view.sortDescending'() {
      this.$nextTick(() => this.applyViewSort());
    },

    /**
     * The columns on show decide whether the view's sort is still reachable - hide the column it
     * names and the table goes back to sorting the way it does by default.
     */
    viewHeaders() {
      this.$nextTick(() => this.applyViewSort());
    },

    /**
     * A response has landed. It only ends the wait if it is the one this view asked for - a
     * request already in flight answers first, and letting that through put the rows of the view
     * being left under the columns of the one arrived at, which is the whole thing being avoided.
     *
     * This rather than `rows`: that prop's array is filled in place, so its identity never turns
     * over and a watcher on it never fires.
     */
    externalPaginationResult() {
      if (this.viewFiltersApplied) {
        this.endViewSwitch();
      }
    },
  },

  computed: {
    /**
     * Whether to show the table views toolbar above this table
     */
    showTableViews() {
      if (this.tableViews !== null) {
        return this.tableViews;
      }

      return !!this.schema?.id && !this.hasAdvancedFiltering;
    },


    /**
     * Whether the saved view tabs belong above this table.
     *
     * The filter, the View menu and the selection actions suit any table. Saved views do not:
     * they are keyed by resource type and kept per user, and a table embedded in something
     * else's detail page is one resource's pods rather than the pod list - there is nothing for
     * a view of "all pods" to mean there, and saving one would put it on the real list.
     *
     * What tells them apart is the route: a detail page names the one resource it is showing,
     * and a list page names the type it lists. Neither needs every call site to say so.
     */
    showTableViewTabs() {
      if (this.tableViewTabs !== null) {
        return this.tableViewTabs;
      }

      if (!this.showTableViews) {
        return false;
      }

      // A page that puts tables under tabs of its own supplies the default. The route cannot
      // always be asked: the cluster dashboard is routed by the cluster rather than by a resource
      // in it, so the tables under its Events and Certificates tabs looked like list pages.
      if (this.providedShowTableViewTabs !== null) {
        return this.providedShowTableViewTabs;
      }

      // A route naming one resource is a detail page, and every table on it is a sub list of
      // that resource - one deployment's pods, its own events - rather than the type's own list.
      //
      // Only the id is looked at. Comparing the route's type against the table's looked more
      // precise and is wrong: the cluster list is routed as `provisioning.cattle.io.cluster`
      // while its table carries the management type, and it lost its tabs.
      return !this.$route?.params?.id;
    },


    /**
     * Every column this resource type has, not only the ones this page chose to show.
     *
     * A page that passes its own `headers` is saying what to show by default, not what exists:
     * the home page and Cluster Management are both lists of the same type, and between them
     * they name eleven columns while each shows seven or eight. Offering only the page's own set
     * meant CPU and Memory could not be added to one, nor Age and Summary to the other.
     *
     * The page's headers keep their order and their place; anything the type knows about that
     * they leave out is added after the last data column, where a new column reads as an addition
     * rather than something that moved.
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

      // What the type registers as its default, for a page that showed its own set instead,
      // plus the columns the type has that no page shows by default
      const fromType = this.headers ? this.$store.getters['type-map/headersFor'](this.schema, this.externalPaginationEnabled) : [];
      const extra = fromType
        .concat(optionalHeadersFor(this.schema.id, this.$store, this.externalPaginationEnabled))
        .filter((header) => {
          const id = headerFieldId(header);

          if (isIgnoredColumn(header) || known[id]) {
            return false;
          }

          // Guards against the same column arriving from both sources
          known[id] = true;

          return true;
        });

      if (!extra.length) {
        return own;
      }

      // After the last column that holds data, so `actions` and friends stay at the end
      let at = own.length;

      for (let i = own.length - 1; i >= 0; i--) {
        if (!isIgnoredColumn(own[i])) {
          at = i + 1;
          break;
        }
      }

      const out = own.slice(0, at).concat(extra.filter((header) => !header.insertBefore), own.slice(at));

      // A column that named where it belongs goes there, so it sits where the list that shows it
      // by default puts it rather than on the end
      extra.filter((header) => header.insertBefore).forEach((header) => {
        const index = out.findIndex((existing) => existing.name === header.insertBefore);

        out.splice(index >= 0 ? index : at, 0, header);
      });

      return out;
    },


    /**
     * The columns this page shows when a view has said nothing about columns - which is what the
     * menu ticks by default, now that it offers more than the page does
     */
    defaultColumnIds() {
      return (this._headers || []).filter((header) => !isIgnoredColumn(header)).map((header) => headerFieldId(header));
    },


    /** The column the table sorts by unless told otherwise, as the headers declare it */
    defaultSortColumnId() {
      const header = (this._headers || []).find((h) => h.defaultSort);

      return header ? headerFieldId(header) : null;
    },


    /** The columns this table will not let go of - see coreFieldIdsFor */
    coreColumnIds() {
      return coreFieldIdsFor(this.defaultColumnIds, this.defaultSortColumnId);
    },


    /**
     * Everything the user can filter on, group by, or add as a column
     */
    viewFields() {
      return fieldsFor(this.availableHeaders, this.filteredRows, (key) => this.t(key));
    },


    /**
     * The caller's templates that go straight to SortableTable.
     *
     * `header-right` is left out: this component renders its own into that slot and puts the
     * caller's inside it, and a duplicate here would win and drop the toolbar.
     */
    passthroughSlots() {
      const { 'header-right': headerRight, ...rest } = this.$slots;

      return (this.showGrouping || this.showTableViews) ? rest : this.$slots;
    },


    /**
     * Fields offered in the group by menu: the columns the table lets you sort by.
     *
     * Grouping is a sort, so the two should name the same columns - and `header.sort` is the very
     * thing the table header reads to decide whether to draw a sort control, so the menu and the
     * headers cannot drift apart. It used to ask the pagination api instead, which was stricter
     * than the headers in one direction and looser in another: the cluster list would let you
     * sort by Provider and Machines while refusing to group by either.
     *
     * Minus the columns with nothing to gather rows under - one that declares no sort has no value
     * the rows can be ordered or gathered by either.
     *
     * A column drawn entirely by a formatter still counts. It carries `value: ''`, but the path it
     * sorts by is a real field on the row, and that is what its rows are gathered under.
     */
    viewGroupFields() {
      return this.viewFields.filter((field) => {
        // A label is read straight off the row, so there is always a value behind it
        if (field.isLabel) {
          return true;
        }

        const { header } = field;

        if (!header?.sort) {
          return false;
        }

        return typeof header.value === 'function' || !!header.value ||
          typeof header.sort === 'string' || (Array.isArray(header.sort) && typeof header.sort[0] === 'string');
      });
    },


    /**
     * Fields offered as filter suggestions.
     *
     * Server side the api only filters on the fields it indexes, and a term naming one of the
     * rest is dropped rather than applied. Offering those would be suggesting a term the toolbar
     * then has to report it ignored, so they are left out of the menu - a query that names one
     * by hand is still read, and still answered for.
     */
    viewFilterFields() {
      if (!this.serverSideTableViews) {
        return this.viewFields;
      }

      return this.viewFields.filter((field) => {
        const raw = serverPathFor(field);
        const paths = Array.isArray(raw) ? raw : [raw];

        return paths.some((path) => typeof path === 'string' && stevePaginationUtils.isValidPaginationField(this.schema, path));
      });
    },


    viewTerms() {
      return parseQuery(this.settledQuery, this.viewFields);
    },


    /**
     * The query as it is actually asked - `or` between clauses, `and` between groups. What
     * filters, both here and at the api.
     */
    viewQuery() {
      return parseQueryExpression(this.settledQuery, this.viewFields);
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
     * Everything about the applied view except what is being typed into it. A tab being picked
     * changes this; typing in the filter does not.
     */
    viewShapeKey() {
      const {
        columns, columnOrder, labelColumns, groupBy
      } = this.view;

      return JSON.stringify([columns, columnOrder, labelColumns, groupBy]);
    },


    /**
     * Whether the request behind the current rows is the one this view asked for: every filter it
     * wanted is being applied, and none of the ones it replaced still are.
     */
    viewFiltersApplied() {
      const applied = (this.externalPaginationArgs?.filters || []).map((filter) => JSON.stringify(filter));
      const wanted = (this.pendingViewFilters || []).map((filter) => JSON.stringify(filter));
      const superseded = (this.supersededViewFilters || []).map((filter) => JSON.stringify(filter));

      return wanted.every((filter) => applied.includes(filter)) &&
        !superseded.some((filter) => !wanted.includes(filter) && applied.includes(filter));
    },


    /**
     * The view's query converted into steve/vai server filters (plus the terms that have
     * no server-side path). Empty when not running server-side
     */
    serverViewFilters() {
      if (!this.serverSideTableViews) {
        return { filters: [], unsupported: [] };
      }

      return queryToServerFilters(this.viewQuery, this.viewFields, { isAllowed: (p) => stevePaginationUtils.isValidPaginationField(this.schema, p) });
    },


    /**
     * The fields named in the query that this list cannot be filtered by, as the user would
     * recognise them.
     *
     * These terms are dropped rather than applied, so without saying so the table answers a
     * query it did not run. Only server side: client side filtering can answer anything.
     */
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

    /**
     * Base url for a value summary request.
     *
     * Suggestions should offer what this list can actually show, so the summary is scoped the
     * same way the list is - the project / namespace filter above all, which otherwise offered
     * values from namespaces the user isn't looking at.
     *
     * Two things are left off. Paging and sort, because a summary counts the whole matching set
     * rather than a page of it. And the view's own query filters, because suggestions for a field
     * shouldn't be narrowed by the term being edited - a field is usually picked to change the
     * term already there.
     */

    /**
     * The filters that scope the list itself - the namespace/project filter and anything the
     * page added - with the view's own query filters taken back out.
     *
     * Compared by value: the filter objects handed to the list are rebuilt on every render, so
     * the ones we sent are never the same objects coming back.
     */
    listScopeFilters() {
      if (this.externalPaginationScope) {
        return this.externalPaginationScope.filters || [];
      }

      // No explicit scope (an older caller), so work it out by taking the view's own filters back
      // out of what the list is asking for
      const args = this.externalPaginationArgs;

      if (!args?.filters?.length) {
        return [];
      }

      const own = this.serverViewFilters.filters.map((filter) => JSON.stringify(filter));

      return args.filters.filter((filter) => !own.includes(JSON.stringify(filter)));
    },


    /** The namespaces/projects the list is scoped to, from whichever source we have */
    listScopeNamespaces() {
      return this.externalPaginationScope?.projectsOrNamespaces || this.externalPaginationArgs?.projectsOrNamespaces || [];
    },


    summaryBaseUrl() {
      const urlFor = this.$store.getters[`${ this.inStore }/urlFor`];
      const args = this.externalPaginationArgs;

      if (!args) {
        return urlFor(this.schema.id);
      }

      // Deliberately no page of its own. `summaryonly` returns no rows but still aggregates over
      // the page window, so asking for a small one counts a handful of rows and offers the user
      // a fraction of the values that are really in use.
      return urlFor(this.schema.id, null, {
        pagination: {
          filters:              this.listScopeFilters,
          projectsOrNamespaces: this.listScopeNamespaces,
        }
      });
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

      return applyQueryExpression(this.filteredRows, this.viewQuery, this.viewFields);
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
      if (!this.viewGroupField) {
        return this.groupSort;
      }

      // The column's own sort path first, which is the one the table uses when its header is
      // clicked - so grouping orders the rows exactly as sorting by that column would. `sort` is
      // often a list whose later entries are only tie breakers, and can carry a `:desc` suffix.
      const sort = this.viewGroupField.header?.sort;
      const first = Array.isArray(sort) ? sort[0] : sort;

      if (typeof first === 'string' && first) {
        return first.split(':')[0];
      }

      // Labels have no header of their own, and neither does a column that says nothing about
      // how it sorts
      const path = serverPathFor(this.viewGroupField);

      return typeof path === 'string' ? path : this.groupSort;
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
        // Chosen from everything the type has rather than only what this page shows, so a column
        // the page left out can be added. Core columns are always kept, even if a saved or
        // shared view omits them.
        out = this.availableHeaders.filter((header) => isIgnoredColumn(header) || this.coreColumnIds.includes(headerFieldId(header)) || !this.viewFields.find((f) => !f.isLabel && f.id === headerFieldId(header)) || this.view.columns.includes(headerFieldId(header)));
      }

      if (this.view.columnOrder?.length) {
        // Only the data columns are reordered; `check`, `actions` and the rest are structural
        // and stay where the table put them
        const order = this.view.columnOrder;
        const movable = out.filter((header) => !isIgnoredColumn(header) && order.includes(headerFieldId(header)));
        const sorted = movable.slice().sort((a, b) => order.indexOf(headerFieldId(a)) - order.indexOf(headerFieldId(b)));
        let next = 0;

        out = out.map((header) => (movable.includes(header) ? sorted[next++] : header));
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
     * The saved views for this type, so the tabs can be counted without the toolbar telling us
     * about them
     */
    savedViews() {
      const stored = this.$store.getters['prefs/get'](TABLE_VIEWS)?.[this.schema?.id];

      // Older preferences held the array directly, before a default view had to live beside it
      return stored?.views || (Array.isArray(stored) ? stored : []) || [];
    },

    /**
     * Every tab that needs a count: the default one (no query) and each saved view. Keyed by
     * the query, because that is all a count depends on.
     */

    /**
     * Every distinct query a tab needs counted: the default tab's (nothing), each saved view's,
     * and whatever the user currently has in the box.
     *
     * Queries rather than views, because that is all a count depends on - two views filtering the
     * same way share one count and one request.
     */
    countableQueries() {
      const out = ['']
        .concat(this.savedViews.map((view) => view.query || ''))
        .concat([this.view.query || ''])
        // A tab left with unsaved edits still shows a count, so what it is showing has to be
        // counted too - its saved query is not what it is filtering by any more
        .concat(this.tabQueries);

      return Array.from(new Set(out));
    },


    /** Changes exactly when the set of counts we'd have to fetch changes */
    viewCountsKey() {
      return JSON.stringify(this.countableQueries);
    },


    /**
     * The scope the counts were taken in. When this changes they are all worth taking again -
     * the same query counts differently in another namespace.
     */
    viewCountsScope() {
      return JSON.stringify(this.listScopeFilters) + JSON.stringify(this.listScopeNamespaces);
    },


    /**
     * Plural display name of what the table holds, for the export modal's sentence
     */
    resourceLabel() {
      if (!this.schema?.id) {
        return '';
      }

      return this.$store.getters['type-map/labelFor'](this.schema, 99).toLowerCase();
    },


    /**
     * Counts for the tabs, worked out here when the filtering is happening in the browser
     */
    localViewCounts() {
      const out = {};

      this.countableQueries.forEach((query) => {
        const parsed = parseQueryExpression(query, this.viewFields);

        out[query] = parsed.clauses.length ? applyQueryExpression(this.filteredRows, parsed, this.viewFields).length : this.filteredRows.length;
      });

      return out;
    },


    /** What the toolbar shows on each tab */
    tabCounts() {
      return this.serverSideTableViews ? this.viewCounts : this.localViewCounts;
    },


    /**
     * Columns to write out when exporting
     */
    exportColumns() {
      return exportColumnsFor(this.viewHeaders, (key) => this.t(key));
    },
  },

  methods: {
    /**
     * Fetch the values in use for a field, so the query input can suggest real values rather
     * than only those on the page in front of us.
     *
     * Steve can summarise a column for us, which counts every row of the type without returning
     * any, so this stays cheap on a big cluster.
     */
    async fetchFieldValues(fieldId) {
      if (!this.serverSideTableViews || this.fieldValues[fieldId] !== undefined) {
        return;
      }

      const field = findField(this.viewFields, fieldId);
      const path = field ? serverPathFor(field) : null;

      if (typeof path !== 'string' || !stevePaginationUtils.isValidPaginationField(this.schema, path)) {
        // Nothing to ask the api for - claim the slot anyway so the input stops asking on every
        // row that arrives, and falls back to the values on the page
        this.fieldValues = { ...this.fieldValues, [fieldId]: [] };

        return;
      }

      // Claim the slot up front so a second keystroke doesn't ask for the same field again
      this.fieldValues = { ...this.fieldValues, [fieldId]: [] };

      try {
        const url = `${ this.summaryBaseUrl }&summary=${ encodeURIComponent(path) }&summaryonly`;
        const res = await this.$store.dispatch(`${ this.inStore }/request`, { opt: { url } });

        this.fieldValues = { ...this.fieldValues, [fieldId]: summaryToValues(res) };
      } catch (e) {
        // Not fatal - the input falls back to the values on the current page
        this.fieldValues = { ...this.fieldValues, [fieldId]: [] };
      }
    },


    /**
     * Count the rows each saved view matches, so its tab can say so.
     *
     * One request per view, asking for a single row and reading the total off the response -
     * the rows themselves are never wanted here. Views whose query the pagination API can't
     * express are left without a count rather than shown a wrong one.
     */
    async fetchViewCounts(refresh = false) {
      if (!this.serverSideTableViews) {
        return;
      }

      // Only what we don't already know. A count already taken stays on its tab until a fresh one
      // replaces it, so nothing ever blinks back to zero while the list is busy
      const wanted = this.countableQueries.filter((query) => refresh || this.viewCounts[query] === undefined);

      // One round at a time. Without this a second trigger arriving mid-flight asks for the same
      // counts again, and the requests already out are left to be superseded - which is what a
      // list of cancelled requests in the network panel looks like.
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
          // Nothing the api can be asked, so the tab shows its name alone. Recorded rather than
          // left unset, which would have every later trigger try it again
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
          // Remember that this one was asked for and couldn't be answered. Leaving it unset meant
          // every later trigger tried it again, so a type whose count the api won't serve turned
          // into a stream of failing requests rather than one. The tab just shows its name, and
          // the next scope change is free to try again.
          this.viewCounts = { ...this.viewCounts, [query]: null };
        }
      }));
    },


    /**
     * A url that returns the total for `filters` and none of the rows behind it
     */
    countUrl(filters) {
      const urlFor = this.$store.getters[`${ this.inStore }/urlFor`];

      return urlFor(this.schema.id, null, {
        pagination: {
          // The list's own scope (the namespace/project filter) still applies - a view counts
          // what it would show, not what exists elsewhere
          filters:              (this.listScopeFilters || []).concat(filters),
          projectsOrNamespaces: this.listScopeNamespaces,
          page:                 1,
          pageSize:             1,
        }
      });
    },


    /**
     * Keep the view in step with the column the table is sorted by.
     *
     * The table reports its sort on mount too, and that first report is its own default - held on
     * to so a sort matching it is stored as "no sort of its own" rather than marking every list
     * changed the moment it loads.
     */
    recordSort(sorting) {
      if (!this.showTableViews || !sorting?.sortBy) {
        return;
      }

      const { sortBy, descending } = sorting;

      // A view asking to be sorted by a column it does not show keeps asking. The table falls back
      // to its own sort, but that fallback is the view's own doing, not an edit to it - recording
      // it would leave such a view reading as changed the moment it was opened, forever.
      const wanted = this.view.sort;

      if (wanted && !this.viewHeaders.some((header) => header.name === wanted)) {
        return;
      }

      // The view asked to be sorted this way and the table has obliged. That the sort happens to
      // be the one the table would have chosen anyway does not make it an edit - recording it as
      // "no sort" leaves the view no longer matching what was saved, so it opens on the default
      // tab wearing its columns and a changed mark.
      if (wanted === sortBy && !!this.view.sortDescending === !!descending) {
        return;
      }

      if (!this.defaultSort) {
        this.defaultSort = { sortBy, descending: !!descending };

        // The table's first report is the sort it arrived with, which it made before being told
        // what the view wants. Recording it over a view that asked for something else throws the
        // view's own sort away before it has been applied - and the view then no longer matches
        // what was saved, so it opens on the default tab wearing its columns and a changed mark.
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


    /**
     * Put the table on the sort its view asks for. A view that names no sort, or names a column
     * that is no longer shown, goes back to the table's own.
     */
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
     * Every row the current filter matches, not just the page on screen.
     *
     * Re-runs the list's own request with `transient`, which fetches without writing to the store,
     * so the table the user is looking at is left alone. It is fetched a page at a time rather
     * than in one go so there is something to report against, and every page after the first is
     * pinned to the revision the first came back at, so a list that changes underneath can not
     * drop or repeat a row between two pages.
     *
     * @param onProgress called with (done, total) after each page arrives
     * @param limit most rows to fetch - see the two export ceilings
     */
    async allMatchingRows(onProgress, limit = EXPORT_ROW_LIMIT) {
      if (!this.externalPaginationEnabled || !this.externalPaginationArgs || !this.schema) {
        return this.viewRows;
      }

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
                ...this.externalPaginationArgs,
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

          // A page that came back short or empty is the end of the list, whatever the count said
          if (data.length < EXPORT_PAGE_SIZE || rows.length >= total) {
            break;
          }
        }
      } catch (e) {
        // Whatever arrived before the failure is still worth writing out. Only an export that
        // got nowhere falls back to what is on screen.
        if (!rows.length) {
          return this.viewRows;
        }
      }

      return rows;
    },


    /**
     * Write the view out, one file per format asked for.
     *
     * What gets exported is every row the view matches, not the page on screen - the view is
     * what the user picked, the page is just where they happen to be in it.
     */
    beginViewSwitch() {
      this.viewSwitching = true;
      clearTimeout(this.viewSwitchTimer);
      // A request that never lands must not leave the table waiting on it for good
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
     * Export the view, every row it matches rather than the page on screen - the view is what the
     * user picked, the page is just where they happen to be in it.
     *
     * That can be a lot of rows and a lot of waiting, so the export is watched in the notification
     * centre instead of holding anything up: a task with a progress bar while it runs, and that
     * same entry turned into a success once the file lands. The store is dispatched to directly
     * rather than going through the shell notification api, which can move a task's progress along
     * but can not turn it into anything else.
     */
    async handleExport({ format, name }) {
      const viewName = name || this.t('tableViews.tabs.all');
      const id = await this.$store.dispatch('notifications/add', {
        level:    NotificationLevel.Task,
        title:    this.t('tableViews.export.notification.title'),
        message:  this.t('tableViews.export.notification.message', { name: viewName, format: (format || '').toUpperCase() }),
        progress: 0,
      });

      // Fetching the rows is the whole of a CSV or JSON export. A YAML one has only started: that
      // asks the api for each resource in turn, which is the greater part of the wait.
      const fetchShare = format === 'yaml' ? 20 : 90;
      const report = (done, total, from, to) => {
        this.$store.dispatch('notifications/update', { id, progress: Math.round(from + (((to - from) * done) / (total || 1))) });
      };

      try {
        const limit = format === 'yaml' ? EXPORT_ROW_LIMIT_YAML : EXPORT_ROW_LIMIT;
        const rows = await this.allMatchingRows((done, total) => report(done, total, 0, fetchShare), limit);

        if (!rows.length || !format) {
          // Nothing was written, so there is nothing to tell the user about afterwards either
          return this.$store.dispatch('notifications/remove', id);
        }

        const file = await this.writeExport(rows, format, (done, total) => report(done, total, fetchShare, 100));

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
     * Turn the rows into a file and hand it to the browser, answering what it was called.
     *
     * Asking for YAML is asking for the resources themselves, which is what the Download YAML
     * action already gives - the manifests as the cluster holds them, not the table's columns
     * written out in YAML. So it is that action rather than a second thing wearing its name.
     */
    async writeExport(rows, format, onProgress) {
      if (format === 'yaml' && typeof rows[0]?.downloadYaml === 'function') {
        if (rows.length === 1) {
          await rows[0].downloadYaml();

          return `${ rows[0].nameDisplay }.yaml`;
        }

        await rows[0].downloadYamlBulk(rows, onProgress);

        return 'resources.zip';
      }

      const columns = this.exportColumns;
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
