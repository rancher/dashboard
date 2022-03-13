<script>
import day from 'dayjs';
import { dasherize, ucFirst } from '@/utils/string';
import { get, clone } from '@/utils/object';
import { removeObject } from '@/utils/array';
import Checkbox from '@/components/form/Checkbox';
import ActionDropdown from '@/components/ActionDropdown';
import $ from 'jquery';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import THead from './THead';
import filtering from './filtering';
import selection from './selection';
import sorting from './sorting';
import paging from './paging';
import grouping from './grouping';
import actions from './actions';

export const COLUMN_BREAKPOINTS = {
  /**
   * Only show column if at tablet width or wider
   */
  TABLET:  'tablet',
  /**
   * Only show column if at laptop width or wider
   */
  LAPTOP:  'laptop',
  /**
   * Only show column if at desktop width or wider
   */
  DESKTOP: 'desktop'
};

// @TODO:
// Fixed header/scrolling

// Data Flow:
// rows prop
// -> arrangedRows (sorting.js)
// -> filteredRows (filtering.js)
// -> pagedRows    (paging.js)
// -> groupedRows  (grouping.js)

export default {
  name:       'SortableTable',
  components: {
    THead, Checkbox, ActionDropdown
  },
  mixins: [filtering, sorting, paging, grouping, selection, actions],

  props: {
    headers: {
      // {
      //    name:   Name for the column (goes in query param) and for defaultSortBy
      //    label:  Displayed column header
      //    sort:   string|array[string] Field name(s) to sort by, default: [name, keyField]
      //              fields can be suffixed with ':desc' to flip the normal sort order
      //    search: string|array[string] Field name(s) to search in, default: [name]
      //    width:  number
      // }
      type:     Array,
      required: true
    },
    rows: {
      // The array of objects to show
      type:     Array,
      required: true
    },
    keyField: {
      // Field that is unique for each row.
      type:     String,
      default: '_key',
    },

    loading: {
      type:     Boolean,
      required: false
    },

    groupBy: {
      // Field to group rows by, row[groupBy] must be something that can be a map key
      type:    String,
      default: null
    },
    groupRef: {
      // Object to provide as the reference for rendering the grouping row
      type:    String,
      default: null,
    },
    groupSort: {
      // Field to order groups by, defaults to groupBy
      type:    Array,
      default: null
    },

    defaultSortBy: {
      // Default field to sort by if none is specified
      // uses name on headers
      type:    String,
      default: null
    },

    tableActions: {
      // Show bulk table actions
      type:    Boolean,
      default: true
    },

    rowActions: {
      // Show action dropdown on the end of each row
      type:    Boolean,
      default: true
    },

    mangleActionResources: {
      type:    Function,
      default: null,
    },

    rowActionsWidth: {
      // How wide the action dropdown column should be
      type:    Number,
      default: 40
    },

    search: {
      // Show search input to filter rows
      type:    Boolean,
      default: true
    },

    extraSearchFields: {
      // Additional fields that aren't defined in the headers to search in on each row
      type:    Array,
      default: null
    },

    subRows: {
      // If there are sub-rows, your main row must have <tr class="main-row"> to identify it
      type:    Boolean,
      default: false,
    },

    subExpandable: {
      type:    Boolean,
      default: false,
    },

    subExpandColumn: {
      type:    Boolean,
      default: false,
    },

    subSearch: {
      // A field containing an array of sub-items to also search in for each row
      type:    String,
      default: null,
    },

    subFields: {
      // Search this list of fields within the items in "subSearch" of each row
      type:    Array,
      default: null,
    },

    /**
     * Show the divider between the thead and tbody.
     */
    topDivider: {
      type:    Boolean,
      default: true
    },

    /**
     * Show the dividers between rows
     */
    bodyDividers: {
      type:    Boolean,
      default: false
    },

    overflowX: {
      type:    Boolean,
      default: false
    },
    overflowY: {
      type:    Boolean,
      default: false
    },

    /**
     * If pagination of the data is enabled or not
     */
    paging: {
      type:    Boolean,
      default: false,
    },

    /**
     * What translation key to use for displaying the '1 - 10 of 100 Things' pagination info
     */
    pagingLabel: {
      type:    String,
      default: 'sortableTable.paging.generic'
    },

    /**
     * Additional params to pass to the pagingLabel translation
     */
    pagingParams: {
      type:    Object,
      default: null,
    },

    /**
     * Allows you to override the default preference of the number of
     * items to display per page. This is used by ./paging.js if you're
     * looking for a reference.
     */
    rowsPerPage: {
      type:    Number,
      default: null, // Default comes from the user preference
    },

    /**
     * Allows you to override the default translation text of no rows view
     */
    noRowsKey: {
      type:    String,
      default: 'sortableTable.noRows'
    },

    /**
     * Allows you to hide the no rows messaging.
     */
    showNoRows: {
      type:    Boolean,
      default: true
    },

    /**
     * Allows you to override the default translation text of no search data view
     */
    noDataKey: {
      type:    String,
      default: 'sortableTable.noData'
    },

    /**
     * Allows you to override showing the THEAD section.
     */
    showHeaders: {
      type:    Boolean,
      default: true
    },

    sortGenerationFn: {
      type:    Function,
      default: null,
    },
  },

  data() {
    return {
      expanded:            {},
      searchQuery:         '',
      eventualSearchQuery: '',
      actionOfInterest:    null,
      loadingDelay:        false,
    };
  },

  mounted() {
    // Add scroll listener to the main element
    const $main = $('main');

    this._onScroll = this.onScroll.bind(this);
    $main.on('scroll', this._onScroll);

    this.updateLiveColumns();
  },

  beforeDestroy() {
    clearTimeout(this._liveColumnsTimer);

    const $main = $('main');

    $main.off('scroll', this._onScroll);
  },

  watch: {
    eventualSearchQuery: debounce(function(q) {
      this.searchQuery = q;
    }, 100),

    // If pagedRows changes then there may be rows that we need to live update
    pagedRows() {
      clearTimeout(this._liveColumnsTimer);
      this.updateLiveColumns();
    }
  },

  computed: {
    fullColspan() {
      let span = 0;

      for ( let i = 0 ; i < this.columns.length ; i++ ) {
        if (!this.columns[i].hide) {
          span++;
        }
      }

      if ( this.tableActions ) {
        span++;
      }

      if ( this.subExpandColumn ) {
        span++;
      }

      if ( this.rowActions ) {
        span++;
      }

      return span;
    },

    noResults() {
      return !!this.searchQuery && this.pagedRows.length === 0;
    },

    noRows() {
      return !this.noResults && (this.rows || []).length === 0;
    },

    showHeaderRow() {
      return this.search ||
        this.tableActions ||
        this.$slots['header-left']?.length ||
        this.$slots['header-middle']?.length ||
        this.$slots['header-right']?.length;
    },

    columns() {
      const out = this.headers.slice();

      if ( this.groupBy ) {
        const entry = out.find(x => x.name === this.groupBy);

        if ( entry ) {
          removeObject(out, entry);
        }
      }

      // If all columns have a width, try to remove it from a column that can be variable (name)
      const missingWidth = out.find(x => !x.width);

      if ( !missingWidth ) {
        const variable = out.find(x => x.canBeVariable);

        if ( variable ) {
          const neu = clone(variable);

          delete neu.width;

          out.splice(out.indexOf(variable), 1, neu);
        }
      }

      return out;
    },

    // For data-title properties on <td>s
    dt() {
      const out = {
        check:   `Select: `,
        actions: `Actions: `,
      };

      this.columns.forEach((col) => {
        out[col.name] = `${ (col.label || col.name) }:`;
      });

      return out;
    },

    classObject() {
      return {
        'top-divider':     this.topDivider,
        'body-dividers':   this.bodyDividers,
        'overflow-y':      this.overflowY,
        'overflow-x':      this.overflowX,
      };
    },

    // Do we have any live columns?
    hasLiveColumns() {
      const liveColumns = this.columns.find(c => c.formatter?.startsWith('Live'));

      return !!liveColumns;
    }
  },

  methods: {

    get,
    dasherize,

    onScroll() {
      if (this.hasLiveColumns) {
        clearTimeout(this._liveColumnsTimer);
        this._liveColumnsTimer = setTimeout(() => {
          this.updateLiveColumns();
        }, 1000);
      }
    },

    updateLiveColumns() {
      if (!this.hasLiveColumns || this.pagedRows.length === 0) {
        return;
      }

      const live = this.$refs.liveColumn;

      // No rush to update the live columns - we may get called before the refs are available, so just try again until they are
      if (!live) {
        this._liveColumnsTimer = setTimeout(() => this.updateLiveColumns(), 500);

        return;
      }

      const now = day();
      let next = Number.MAX_SAFE_INTEGER;

      live.forEach((c) => {
        if (c.liveUpdate) {
          const diff = c.liveUpdate(now);

          if (diff < next) {
            next = diff;
          }
        }
      });

      if (next < 1 ) {
        next = 1;
      }

      // Schedule again
      this._liveColumnsTimer = setTimeout(() => this.updateLiveColumns(), next * 1000);
    },

    labelFor(col) {
      if ( col.labelKey ) {
        return this.t(col.labelKey, undefined, true);
      } else if ( col.label ) {
        return col.label;
      }

      return ucFirst(col.name);
    },

    valueFor(row, col) {
      const expr = col.value || col.name;
      const out = get(row, expr);

      if ( out === null || out === undefined ) {
        return '';
      }

      return out;
    },

    /**
     * Format values to render in the sorted table
     * In the absence of predefined formatter table would use this
     *
     * @param {Object} row
     * @param {Object} col
     *
     * @return {String}
     */
    formatValue(row, col) {
      const valFor = this.valueFor(row, col);

      if ( Array.isArray(valFor) ) {
        return valFor.join(', ');
      }

      return valFor;
    },

    isExpanded(row) {
      const key = row[this.keyField];

      return !!this.expanded[key];
    },

    toggleExpand(row) {
      const key = row[this.keyField];
      const val = !this.expanded[key];

      this.expanded[key] = val;
      this.expanded = { ...this.expanded };

      return val;
    },

    setBulkActionOfInterest(action) {
      this.actionOfInterest = action;
    },

    // Can the action of interest be applied to the specified resource?
    canRunBulkActionOfInterest(resource) {
      if (!this.actionOfInterest) {
        return false;
      }

      const matchingResourceAction = resource.availableActions.find(a => a.action === this.actionOfInterest.action);

      return matchingResourceAction?.enabled;
    },

    focusSearch() {
      if ( this.$refs.searchQuery ) {
        this.$refs.searchQuery.focus();
        this.$refs.searchQuery.select();
      }
    },

    nearestCheckbox() {
      const $cur = $(document.activeElement).closest('tr.main-row').find('.checkbox-custom');

      return $cur[0];
    },

    focusAdjacent(next = true) {
      const all = $('.checkbox-custom', this.$el).toArray();
      const cur = this.nearestCheckbox();
      let idx = -1;

      if ( cur ) {
        idx = all.indexOf(cur) + (next ? 1 : -1 );
      } else if ( next ) {
        idx = 1;
      } else {
        idx = all.length - 1;
      }

      if ( idx < 1 ) { // Don't go up to the check all button
        idx = 1;
      }

      if ( idx >= all.length ) {
        idx = all.length - 1;
      }

      if ( all[idx] ) {
        all[idx].focus();

        return all[idx];
      }
    },

    focusNext: throttle(function(event, more = false) {
      const elem = this.focusAdjacent(true);
      const row = $(elem).parents('tr');

      this.keySelectRow(row, more);
    }, 50),

    focusPrevious: throttle(function(event, more = false) {
      const elem = this.focusAdjacent(false);
      const row = $(elem).parents('tr');

      this.keySelectRow(row, more);
    }, 50),

    showSubRow(row, keyField) {
      const hasInjectedSubRows = this.subRows && (!this.subExpandable || this.expanded[get(row, keyField)]);
      const hasStateDescription = row.stateDescription;

      return hasInjectedSubRows || hasStateDescription;
    }
  }
};
</script>

<template>
  <div ref="container">
    <div :class="{'titled': $slots.title && $slots.title.length}" class="sortable-table-header">
      <slot name="title" />
      <div v-if="showHeaderRow" class="fixed-header-actions">
        <div :class="bulkActionsClass" class="bulk">
          <slot name="header-left">
            <template v-if="tableActions">
              <button
                v-for="act in availableActions"
                :id="act.action"
                :key="act.action"
                v-tooltip="actionTooltip"
                type="button"
                class="btn role-primary"
                :class="{[bulkActionClass]:true}"
                :disabled="!act.enabled"
                @click="applyTableAction(act, null, $event)"
                @mouseover="setBulkActionOfInterest(act)"
                @mouseleave="setBulkActionOfInterest(null)"
              >
                <i v-if="act.icon" :class="act.icon" />
                <span v-html="act.label" />
              </button>
              <ActionDropdown :class="bulkActionsDropdownClass" class="bulk-actions-dropdown" :disable-button="!selectedRows.length" size="sm">
                <template #button-content>
                  <button ref="actionDropDown" class="btn bg-primary mr-0" :disabled="!selectedRows.length">
                    <i class="icon icon-gear" />
                    <span>{{ t('harvester.tableHeaders.actions') }}</span>
                    <i class="ml-10 icon icon-chevron-down" />
                  </button>
                </template>
                <template #popover-content>
                  <ul class="list-unstyled menu">
                    <li
                      v-for="act in hiddenActions"
                      :key="act.action"
                      v-close-popover
                      v-tooltip="{
                        content: actionTooltip,
                        placement: 'right'
                      }"
                      :class="{ disabled: !act.enabled }"
                      @click="applyTableAction(act, null, $event)"
                      @mouseover="setBulkActionOfInterest(act)"
                      @mouseleave="setBulkActionOfInterest(null)"
                    >
                      <i v-if="act.icon" :class="act.icon" />
                      <span v-html="act.label" />
                    </li>
                  </ul>
                </template>
              </ActionDropdown>
              <label v-if="selectedRowsText" :class="bulkActionAvailabilityClass" class="action-availability">
                {{ selectedRowsText }}
              </label>
            </template>
          </slot>
        </div>
        <div v-if="$slots['header-middle'] && $slots['header-middle'].length" class="middle">
          <slot name="header-middle" />
        </div>

        <div v-if="search || ($slots['header-right'] && $slots['header-right'].length)" class="search">
          <slot name="header-right" />
          <input
            v-if="search"
            ref="searchQuery"
            v-model="eventualSearchQuery"
            type="search"
            class="input-sm"
            :placeholder="t('sortableTable.search')"
          >
        </div>
      </div>
    </div>
    <table class="sortable-table" :class="classObject" width="100%">
      <THead
        v-if="showHeaders"
        :label-for="labelFor"
        :columns="columns"
        :table-actions="tableActions"
        :row-actions="rowActions"
        :sub-expand-column="subExpandColumn"
        :row-actions-width="rowActionsWidth"
        :how-much-selected="howMuchSelected"
        :sort-by="sortBy"
        :default-sort-by="_defaultSortBy"
        :descending="descending"
        :no-rows="noRows"
        :loading="loading && !loadingDelay"
        :no-results="noResults"
        @on-toggle-all="onToggleAll"
        @on-sort-change="changeSort"
      />

      <!-- Don't display anything if we're loading and the delay has yet to pass -->
      <div v-if="loading && !loadingDelay"></div>

      <tbody v-else-if="loading">
        <slot name="loading">
          <tr>
            <td :colspan="fullColspan">
              <div class="data-loading">
                <i class="icon-spin icon icon-spinner" />
                <t k="generic.loading" :raw="true" />
              </div>
            </td>
          </tr>
        </slot>
      </tbody>
      <tbody v-else-if="noRows">
        <slot name="no-rows">
          <tr class="no-rows">
            <td :colspan="fullColspan">
              <t v-if="showNoRows" :k="noRowsKey" />
            </td>
          </tr>
        </slot>
      </tbody>
      <tbody v-else-if="noResults">
        <slot name="no-results">
          <tr class="no-results">
            <td :colspan="fullColspan" class="text-center">
              <t :k="noDataKey" />
            </td>
          </tr>
        </slot>
      </tbody>
      <tbody v-for="group in groupedRows" v-else :key="group.key" :class="{ group: groupBy }">
        <slot v-if="groupBy" name="group-row" :group="group" :fullColspan="fullColspan">
          <tr class="group-row">
            <td :colspan="fullColspan">
              <slot name="group-by" :group="group">
                <div v-trim-whitespace class="group-tab">
                  {{ group.ref }}
                </div>
              </slot>
            </td>
          </tr>
        </slot>
        <template v-for="(row, i) in group.rows">
          <slot name="main-row" :row="row">
            <slot :name="'main-row:' + (row.mainRowKey || i)" :full-colspan="fullColspan">
              <!-- The data-cant-run-bulk-action-of-interest attribute is being used instead of :class because
              because our selection.js invokes toggleClass and :class clobbers what was added by toggleClass if
              the value of :class changes. -->
              <tr :key="get(row,keyField)" class="main-row" :class="{ 'has-sub-row': showSubRow(row, keyField)}" :data-node-id="get(row,keyField)" :data-cant-run-bulk-action-of-interest="actionOfInterest && !canRunBulkActionOfInterest(row)">
                <td v-if="tableActions" class="row-check" align="middle">
                  {{ row.mainRowKey }}<Checkbox class="selection-checkbox" :data-node-id="get(row,keyField)" :value="selectedRows.includes(row)" />
                </td>
                <td v-if="subExpandColumn" class="row-expand" align="middle">
                  <i data-title="Toggle Expand" :class="{icon: true, 'icon-chevron-right': true, 'icon-chevron-down': !!expanded[get(row, keyField)]}" @click.stop="toggleExpand(row)" />
                </td>
                <template v-for="col in columns">
                  <slot
                    :name="'col:' + col.name"
                    :row="row"
                    :col="col"
                    :dt="dt"
                    :expanded="expanded"
                    :rowKey="get(row,keyField)"
                  >
                    <td
                      :key="col.name"
                      :data-title="labelFor(col)"
                      :align="col.align || 'left'"
                      :class="{['col-'+dasherize(col.formatter||'')]: !!col.formatter, [col.breakpoint]: !!col.breakpoint, ['skip-select']: col.skipSelect}"
                      :width="col.width"
                    >
                      <slot :name="'cell:' + col.name" :row="row" :col="col" :value="valueFor(row,col)">
                        <component
                          :is="col.formatter"
                          v-if="col.formatter && col.formatter.startsWith('Live')"
                          ref="liveColumn"
                          :value="valueFor(row,col)"
                          :row="row"
                          :col="col"
                          v-bind="col.formatterOpts"
                          :row-key="get(row,keyField)"
                        />
                        <component
                          :is="col.formatter"
                          v-else-if="col.formatter"
                          :value="valueFor(row,col)"
                          :row="row"
                          :col="col"
                          v-bind="col.formatterOpts"
                          :row-key="get(row,keyField)"
                        />
                        <template v-else-if="valueFor(row,col) !== ''">
                          {{ formatValue(row,col) }}
                        </template>
                        <template v-else-if="col.dashIfEmpty">
                          <span class="text-muted">&mdash;</span>
                        </template>
                      </slot>
                    </td>
                  </slot>
                </template>
                <td v-if="rowActions" align="middle">
                  <slot name="row-actions" :row="row">
                    <button aria-haspopup="true" aria-expanded="false" type="button" class="btn btn-sm role-multi-action actions">
                      <i class="icon icon-actions" />
                    </button>
                  </slot>
                </td>
              </tr>
            </slot>
          </slot>
          <slot
            v-if="showSubRow(row, keyField)"
            name="sub-row"
            :full-colspan="fullColspan"
            :row="row"
            :sub-matches="subMatches"
          >
            <tr v-if="row.stateDescription" :key="get(row,keyField) + '-description'" class="state-description sub-row">
              <td v-if="tableActions" class="row-check" align="middle">
              </td>
              <td :colspan="fullColspan - (tableActions ? 1: 0)" :class="{ 'text-error' : row.stateObj.error }">
                {{ row.stateDescription }}
              </td>
            </tr>
          </slot>
        </template>
      </tbody>
    </table>
    <div v-if="showPaging" class="paging">
      <button
        type="button"
        class="btn btn-sm role-multi-action"
        :disabled="page == 1"
        @click="goToPage('first')"
      >
        <i class="icon icon-chevron-beginning" />
      </button>
      <button
        type="button"
        class="btn btn-sm role-multi-action"
        :disabled="page == 1"
        @click="goToPage('prev')"
      >
        <i class="icon icon-chevron-left" />
      </button>
      <span>
        {{ pagingDisplay }}
      </span>
      <button
        type="button"
        class="btn btn-sm role-multi-action"
        :disabled="page == totalPages"
        @click="goToPage('next')"
      >
        <i class="icon icon-chevron-right" />
      </button>
      <button
        type="button"
        class="btn btn-sm role-multi-action"
        :disabled="page == totalPages"
        @click="goToPage('last')"
      >
        <i class="icon icon-chevron-end" />
      </button>
    </div>
    <button v-if="search" v-shortkey.once="['/']" class="hide" @shortkey="focusSearch()" />
    <template v-if="tableActions">
      <button v-shortkey="['j']" class="hide" @shortkey="focusNext($event)" />
      <button v-shortkey="['k']" class="hide" @shortkey="focusPrevious($event)" />
      <button v-shortkey="['shift','j']" class="hide" @shortkey="focusNext($event, true)" />
      <button v-shortkey="['shift','k']" class="hide" @shortkey="focusPrevious($event, true)" />
      <slot name="shortkeys" />
    </template>
  </div>
</template>

<style lang="scss" scoped>
  // Remove colors from multi-action buttons in the table
  td {
    .actions.role-multi-action {
      background-color: transparent;
      border: none;
      font-size: 18px;
      &:hover, &:focus {
        background-color: var(--accent-btn);
        box-shadow: none;
      }
    }

    // Aligns with COLUMN_BREAKPOINTS
    @media only screen and (max-width: map-get($breakpoints, '--viewport-4')) {
      // HIDE column on sizes below 480px
      &.tablet, &.laptop, &.desktop {
        display: none;
      }
    }
    @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
      // HIDE column on sizes below 992px
      &.laptop, &.desktop {
        display: none;
      }
    }
    @media only screen and (max-width: map-get($breakpoints, '--viewport-12')) {
      // HIDE column on sizes below 1281px
      &.desktop {
        display: none;
      }
    }
  }

  // Loading indicatorr ow
  tr td div.data-loading {
    align-items: center;
    display: flex;
    justify-content: center;
    padding: 20px 0;
    > i {
      font-size: 20px;
      height: 20px;
      margin-right: 5px;
      width: 20px;
    }
  }
</style>

<style lang="scss">
//
// Important: Almost all selectors in here need to be ">"-ed together so they
// apply only to the current table, not one nested inside another table.
//

$group-row-height: 40px;
$group-separation: 40px;
$divider-height: 1px;

$separator: 20;
$remove: 100;
$spacing: 10px;

.sortable-table {
  border-collapse: collapse;
  min-width: 400px;
  border-radius: 5px 5px 0 0;
  outline: 1px solid var(--border);
  overflow: hidden;
  background: var(--sortable-table-bg);
  border-radius: 4px;

  &.overflow-x {
    overflow-x: visible;
  }
  &.overflow-y {
    overflow-y: visible;
  }

  td {
    padding: 8px 5px;
    border: 0;

    &:first-child {
      padding-left: 10px;
    }

    &:last-child {
      padding-right: 10px;
    }

    &.row-check {
      padding-top: 12px;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--sortable-table-top-divider);
      background-color: var(--sortable-table-row-bg);

      &.main-row.has-sub-row {
        border-bottom: 0;
      }

      // if a main-row is hovered also hover it's sibling sub row. note - the reverse is handled in selection.js
      &.main-row:not(.row-selected):hover + .sub-row {
        background-color: var(--sortable-table-hover-bg);
      }

      &:last-of-type {
        border-bottom: 0;
      }

      &:hover, &.sub-row-hovered {
        background-color: var(--sortable-table-hover-bg);
      }

      &.state-description > td {
        font-size: 13px;
        padding-top: 0;
        overflow-wrap: anywhere;
      }
    }

    tr.active-row {
      color: var(--sortable-table-header-bg);
    }

    tr.row-selected {
      background: var(--sortable-table-selected-bg);
    }

    .no-rows {
      td {
        padding: 30px 0;
        text-align: center;
      }
    }

    .no-rows, .no-results {
      &:hover {
        background-color: var(--body-bg);
      }
    }

    &.group {
      &:before {
        content: "";
        display: block;
        height: 20px;
        background-color: transparent;
      }
    }

    tr.group-row {
      background-color: initial;

      &:first-child {
        border-bottom: 2px solid var(--sortable-table-row-bg);
      }

      &:not(:first-child) {
        margin-top: 20px;
      }

      td {
        padding: 0;

        &:first-of-type {
          border-left: 1px solid var(--sortable-table-accent-bg);
        }
      }

      .group-tab {
        @include clearfix;
        height: $group-row-height;
        line-height: $group-row-height;
        padding: 0 10px;
        border-radius: 4px 4px 0px 0px;
        background-color: var(--sortable-table-row-bg);
        position: relative;
        top: 1px;
        display: inline-block;
        z-index: z-index('tableGroup');
        min-width: $group-row-height * 1.8;

        > SPAN {
          color: var(--sortable-table-group-label);
        }
      }

      .group-tab:after {
        height: $group-row-height;
        width: 70px;
        border-radius: 5px 5px 0px 0px;
        background-color: var(--sortable-table-row-bg);
        content: "";
        position: absolute;
        right: -15px;
        top: 0px;
        transform: skewX(40deg);
        z-index: -1;
      }
    }
  }
}

 .for-inputs{
   & TABLE.sortable-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: $spacing;

    >TBODY>TR>TD, >THEAD>TR>TH {
      padding-right: $spacing;
      padding-bottom: $spacing;

      &:last-of-type {
        padding-right: 0;
      }
    }

    >TBODY>TR:first-of-type>TD {
      padding-top: $spacing;
    }

    >TBODY>TR:last-of-type>TD {
      padding-bottom: 0;
    }
  }

    &.edit, &.create, &.clone {
     TABLE.sortable-table>THEAD>TR>TH {
      border-color: transparent;
      }
    }
  }

.sortable-table-header {
  position: relative;
  z-index: z-index('fixedTableHeader');

  &.titled {
    display: flex;
    align-items: center;
  }
}

.fixed-header-actions {
  padding: 0 0 20px 0;
  width: 100%;
  z-index: z-index('fixedTableHeader');
  background: transparent;
  display: grid;
  grid-template-columns: [bulk] auto [middle] min-content [search] minmax(min-content, 200px);
  grid-column-gap: 10px;

  .bulk {
    grid-area: bulk;
    margin-top: 1px;

    $gap: 10px;

    & > BUTTON {
      display: none; // Handled dynamically
    }

    & > BUTTON:not(:last-of-type) {
      margin-right: $gap;
    }

    .action-availability {
      display: none; // Handled dynamically
      margin-left: $gap;
      vertical-align: middle;
      margin-top: 2px;
    }

    .dropdown-button {
      $disabled-color: var(--disabled-text);
      $disabled-cursor: not-allowed;
      li.disabled {
        color: $disabled-color;
        cursor: $disabled-cursor;

        &:hover {
          color: $disabled-color;
          background-color: unset;
          cursor: $disabled-cursor;
        }
      }
    }
  }

  .middle {
    grid-area: middle;
    white-space: nowrap;
  }

  .search {
    grid-area: search;
    text-align: right;
  }

  .bulk-actions-dropdown {
    display: none; // Handled dynamically

    .dropdown-button {
      background-color: var(--primary);

      &:hover {
        background-color: var(--primary-hover-bg);
        color: var(--primary-hover-text);
      }

      > *, .icon-chevron-down {
        color: var(--primary-text);
      }

      .button-divider {
        border-color: var(--primary-text);
      }

      &.disabled {
        border-color: var(--disabled-bg);

        .icon-chevron-down {
          color: var(--disabled-text) !important;
        }

        .button-divider {
          border-color: var(--disabled-text);
        }
      }
    }
  }
}

.paging {
  margin-top: 10px;
  text-align: center;

  SPAN {
    display: inline-block;
    min-width: 200px;
  }
}
</style>
