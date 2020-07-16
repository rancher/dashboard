<script>
import { mapState } from 'vuex';
import { dasherize } from '@/utils/string';
import { get, clone } from '@/utils/object';
import { removeObject } from '@/utils/array';
import Checkbox from '@/components/form/Checkbox';
import THead from './THead';
import filtering from './filtering';
import selection from './selection';
import sorting from './sorting';
import paging from './paging';
import grouping from './grouping';

// @TODO:
// Fixed header/scrolling

// Data Flow:
// rows prop
// -> filteredRows (filtering.js)
// -> arrangedRows (sorting.js)
// -> pagedRows    (paging.js)
// -> groupedRows  (grouping.js)

export default {
  name:       'SortableTable',
  components: { THead, Checkbox },
  mixins:     [filtering, sorting, paging, grouping, selection],

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
      required: true,
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

    /**
     * Emphasize the text within tbody to have a brighter color.
     */
    emphasizedBody: {
      type:    Boolean,
      default: true
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
    }

  },

  data() {
    return { expanded: {} };
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
      return !this.noResults && this.rows.length === 0;
    },

    showHeaderRow() {
      return this.search || this.tableActions;
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

    availableActions() {
      return this.$store.getters[`${ this.storeName }/forTable`];
    },

    actionAvailability() {
      if (this.tableSelected.length === 0) {
        return null;
      }

      const runnableTotal = this.tableSelected.filter(this.canRunBulkActionOfInterest).length;
      const selectionTotal = this.tableSelected.length;
      const tableTotal = this.arrangedRows.length;
      const allOfSelectionIsActionable = runnableTotal === selectionTotal;
      const useTableTotal = !this.actionOfInterest || allOfSelectionIsActionable;

      const input = {
        actionable: this.actionOfInterest ? runnableTotal : selectionTotal,
        total:      useTableTotal ? tableTotal : selectionTotal,
      };

      const someActionable = this.actionOfInterest && !allOfSelectionIsActionable;
      const key = someActionable ? 'sortableTable.actionAvailability.some' : 'sortableTable.actionAvailability.selected';

      return this.t(key, input);
    },

    ...mapState({
      tableSelected(state) {
        return state[this.storeName].tableSelected;
      },
      actionOfInterest(state) {
        return state[this.storeName].actionOfInterest;
      }
    }),

    classObject() {
      return {
        'top-divider':     this.topDivider,
        'emphasized-body': this.emphasizedBody,
        'body-dividers':   this.bodyDividers
      };
    }
  },

  methods: {
    get,
    dasherize,

    valueFor(row, col) {
      const expr = col.value || col.name;

      return get(row, expr);
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
      this.$store.commit(`${ this.storeName }/setBulkActionOfInterest`, action);
    },

    canRunBulkActionOfInterest(resource) {
      const result = this.$store.getters[`${ this.storeName }/canRunBulkActionOfInterest`](resource);

      return result;
    },

    focusSearch() {
      this.$refs.searchQuery.focus();
      this.$refs.searchQuery.select();
    }
  }
};
</script>

<template>
  <div>
    <div class="sortable-table-header">
      <div v-if="showHeaderRow" class="fixed-header-actions">
        <div v-if="tableActions" class="bulk">
          <button
            v-for="act in availableActions"
            :key="act.action"
            type="button"
            class="btn bg-primary btn-sm"
            :disabled="!act.enabled"
            @click="applyTableAction(act, null, $event)"
            @mouseover="setBulkActionOfInterest(act)"
            @mouseleave="setBulkActionOfInterest(null)"
          >
            <i v-if="act.icon" :class="act.icon" />
            {{ act.label }}
          </button>
          <span />
          <label v-if="actionAvailability" class="action-availability">
            {{ actionAvailability }}
          </label>
        </div>

        <div class="middle">
          <slot name="header-middle" />
        </div>

        <div v-if="search" class="search">
          <input ref="searchQuery" v-model="searchQuery" type="search" class="input-sm" placeholder="Filter">
        </div>

        <div class="end">
          <slot name="header-end" />
        </div>
      </div>
    </div>
    <table class="sortable-table" :class="classObject" width="100%">
      <THead
        v-if="showHeaders"
        :columns="columns"
        :table-actions="tableActions"
        :row-actions="rowActions"
        :sub-expand-column="subExpandColumn"
        :row-actions-width="rowActionsWidth"
        :how-much-selected="howMuchSelected"
        :sort-by="sortBy"
        :default-sort-by="_defaultSortBy"
        :descending="descending"
        @on-toggle-all="onToggleAll"
        @on-sort-change="changeSort"
      />

      <tbody v-if="noRows">
        <slot name="no-rows">
          <tr>
            <td :colspan="fullColspan" class="no-rows">
              <t v-if="showNoRows" :k="noRowsKey" />
            </td>
          </tr>
        </slot>
      </tbody>
      <tbody v-else-if="noResults">
        <slot name="no-results">
          <tr>
            <td :colspan="fullColspan" class="no-results text-center">
              <t :k="noDataKey" />
            </td>
          </tr>
        </slot>
      </tbody>

      <tbody v-for="group in groupedRows" :key="group.key" :class="{ group: groupBy }">
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
        <template v-for="row in group.rows">
          <slot name="main-row" :row="row">
            <!-- The data-cant-run-bulk-action-of-interest attribute is being used instead of :class because
            because our selection.js invokes toggleClass and :class clobbers what was added by toggleClass if
            the value of :class changes. -->
            <tr :key="get(row,keyField)" class="main-row" :data-cant-run-bulk-action-of-interest="actionOfInterest && !canRunBulkActionOfInterest(row)">
              <td v-show="tableActions" class="row-check" align="middle">
                <Checkbox class="selection-checkbox" type="checkbox" :data-node-id="get(row,keyField)" :value="tableSelected.includes(row)" />
              </td>
              <td v-if="subExpandColumn" class="row-expand" align="middle">
                <i data-title="Toggle Expand" :class="{icon: true, 'icon-chevron-right': true, 'icon-chevron-down': !!expanded[get(row, keyField)]}" />
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
                  <td :key="col.name" :data-title="dt[col.name]" :align="col.align || 'left'" :class="{['col-'+dasherize(col.formatter||'')]: !!col.formatter}" :width="col.width">
                    <slot :name="'cell:' + col.name" :row="row" :col="col">
                      <component
                        :is="col.formatter"
                        v-if="col.formatter"
                        :value="valueFor(row,col)"
                        :row="row"
                        :col="col"
                        v-bind="col.formatterOpts"
                      />
                      <template v-else>
                        {{ valueFor(row,col) }}
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
          <slot
            v-if="subRows && (!subExpandable || expanded[get(row,keyField)])"
            name="sub-row"
            :full-colspan="fullColspan"
            :row="row"
            :sub-matches="subMatches"
          />
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
    <button v-shortkey.once="['/']" class="hide" @shortkey="focusSearch()" />
  </div>
</template>

<style lang="scss">
//
// Important: Almost all selectors in here need to be ">"-ed together so they
// apply only to the current table, not one nested inside another table.
//

$group-row-height: 40px;
$group-separation: 40px;
$divider-height: 1px;

$separator: 20;
$remove: 75;
$spacing: 10px;

// .sortable-table {
//   position: relative;
//   table-layout: fixed;
//   border-spacing: 0;
//   width: 100%;

//   &.top-divider > THEAD > TR > TH {
//     border-width: 0 0 $divider-height 0;
//   }

//   > THEAD > TR > TH,
//   > TBODY > TR > TD {
//     padding: 0;
//     transition: none;
//     word-wrap: break-word;

//     &:last-child {
//       height: 0;
//     }
//   }

//   > THEAD {
//     background: var(--sortable-table-header-bg);

//     > TR {
//       width: 100%;
//       box-sizing: border-box;
//       outline: none;
//       transition: none;

//       > TH {
//         border-width: 0;
//         border-style: solid;
//         border-color: var(--sortable-table-top-divider);
//         border-radius: 0;
//         outline: none;
//         transition: none;
//         color: var(--secondary);

//         &.sortable a {
//           color: var(--secondary);
//         }
//         font-weight: normal;

//         &.sortable {
//           cursor: pointer;

//           .text-right A {
//             position: relative;
//             left: -15px;
//           }
//         }

//         &.check {
//           position: relative;
//           padding-left: 11px;
//           cursor: pointer;
//           user-select: none;
//         }

//         I.icon-sort, I[class*="icon-sort-"]{
//           width: 15px;

//           &.faded {
//             opacity: .3;
//           }
//         }
//       }
//     }
//   }

//   &.emphasized-body > TBODY > TR > TD {
//     color: var(--body-text);
//   }

//   &.body-dividers > TBODY > TR > TD {
//     border-bottom: 1px solid var(--sortable-table-body-divider);
//   }

//   > TBODY {
//     border: none;

//     &.group {
//       &:before {
//         content: "";
//         display: block;
//         height: 20px;
//         background-color: var(--body-bg);
//       }

//       &:first-of-type:before {
//         height: 0;
//       }

//       background: var(--sortable-table-accent-bg);

//       .group-row {
//         background-color: var(--body-bg);

//         :first-child {
//           margin-top: 20px;
//         }
//       }

//       .group-tab {
//         @include clearfix;
//         height: $group-row-height;
//         line-height: $group-row-height;
//         padding: 0 10px;
//         border-radius: 4px 4px 0px 0px;
//         background-color: var(--sortable-table-accent-bg);
//         position: relative;
//         top: 0;
//         display: inline-block;
//         z-index: z-index('tableGroup');
//         min-width: $group-row-height * 1.8;

//         > SPAN {
//           color: var(--sortable-table-group-label);
//         }
//       }

//       .group-tab:after {
//         height: $group-row-height;
//         width: 70px;
//         border-radius: 5px 5px 0px 0px;
//         background-color: var(--sortable-table-accent-bg);
//         content: "";
//         position: absolute;
//         right: -15px;
//         top: 0px;
//         transform: skewX(40deg);
//         z-index: -1;
//       }
//     }

//     > TR > TD {
//       height: $group-row-height;
//       vertical-align: middle;
//       color: var(--muted);

//       &.clip {
//         padding-right: 25px;
//       }

//       &.row-expand, &.row-check {
//         cursor: pointer;
//       }

//       .actions {
//         padding: 5px;
//       }
//     }

//     > TR.auto-height > TD,
//     > TR.auto-height > TH {
//       height: auto;
//     }

//     > TR.row-selected {
//       background-color: var(--sortable-table-selected-bg);
//     }

//     > TR.separator-row > TD {
//       background: var(--sortable-table-bg);
//     }

//     > TR.group-row > TD,
//     > TR.total > TD {
//       height: $group-row-height;
//     }

//     > TR.total > TD {
//       background: var(--sortable-table-accent-bg);
//     }

//     > TR > TD.no-results {
//       padding: 20px;
//       color: var(--muted);
//     }
//   }

//   .fixed-header-widthinator {
//     visibility: hidden;
//     height: 0 !important;

//     TH {
//       border: 0 !important;
//       padding: 0 !important;
//       height: 0 !important;
//     }
//   }

//   .double-rows > TBODY {
//     > TR.main-row > TD {
//       padding-bottom: 0;
//       line-height: 15px;

//       &.top-half {
//         border-bottom: 1px solid transparent;
//       }
//     }

//     > TR.sub-row > TD {
//       padding-top: 0;
//       border-bottom: solid thin var(--border);
//     }
//   }

//   .no-rows {
//     padding: $group-row-height;
//     color: var(--disabled-bg) !important;
//     text-align: center;
//   }

//   TH[align=left], TD[align=left] { text-align: left; }
//   TH[align=center], TD[align=center] { text-align: center; }
//   TH[align=right], TD[align=right] { text-align: right; }
// }

.sortable-table {
  border-collapse: collapse;
  margin: 25px 0;
  font-size: 0.9em;
  min-width: 400px;
  border-radius: 5px 5px 0 0;
  overflow: hidden;
  box-shadow: 0 0 20px var(--shadow);
  background: var(--body-bg);
  border-radius: 4px;

  thead {
    tr {
      background-color: var(--sortable-table-header-bg);
      color: var(--body-text);
      text-align: left;
    }
  }

  th {
    padding: 12px 15px;
    font-weight: normal;
    border: 0;
  }

  td {
    padding: 12px 15px;
    border: 0;
  }

<<<<<<< HEAD
  > TBODY {
    border: none;

    &.group {
      &:first-of-type:before {
        height: 0;
      }

      background: var(--sortable-table-accent-bg);

      .group-row {
        background-color: var(--body-bg);

        :first-child {
          margin-top: 20px;
        }
      }

      .group-tab {
        @include clearfix;
        height: $group-row-height;
        line-height: $group-row-height;
        padding: 0 10px;
        border-radius: 4px 4px 0px 0px;
        background-color: var(--sortable-table-accent-bg);
        position: relative;
        top: 0;
        display: inline-block;
        z-index: z-index('tableGroup');
        min-width: $group-row-height * 1.8;

        > SPAN {
          color: var(--sortable-table-group-label);
        }
      }
=======
  tbody {
    tr {
      border-bottom: 1px solid var(--sortable-table-top-divider);
>>>>>>> WIP table and polish

      &:nth-of-type(even) {
        background-color: var(--sortable-table-accent-bg);
      }

      &:last-of-type {
        border-bottom: 0;
      }
    }

    tr.active-row {
      color: var(--sortable-table-header-bg);
    }

    &.group {
      &:before {
        content: "";
        display: block;
        height: 20px;
        background-color: var(--body-bg);
      }
    }

    tr.group-row {
      &:first-child {
        border-bottom: 0;
      }

      &:not(:first-child) {
        margin-top: 20px;
      }

      td {
        padding: 0;
      }

      .group-tab {
        @include clearfix;
        height: $group-row-height;
        line-height: $group-row-height;
        padding: 0 10px;
        border-radius: 4px 4px 0px 0px;
        background-color: var(--sortable-table-accent-bg);
        position: relative;
        top: 0;
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
        background-color: var(--sortable-table-accent-bg);
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
}

.fixed-header-actions {
  padding: 0 0 20px 0;
  width: 100%;
  z-index: z-index('fixedTableHeader');
<<<<<<< HEAD
  // background: var(--sortable-table-header-bg);
=======
  background: transparent;
>>>>>>> WIP table and polish
  display: grid;
  grid-template-columns: [bulk] auto [middle] min-content [search] minmax(min-content, 200px) [end] min-content;
  grid-column-gap: 10px;

  .bulk {
    grid-area: bulk;
    align-self: center;

    BUTTON:not(:last-child) {
      margin-right: 10px;
    }
  }

  .middle {
    grid-area: middle;
    white-space: nowrap;
    align-self: center;
  }

  .search {
    grid-area: search;
  }

  .end {
    grid-area: end;
    white-space: nowrap;
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
