<script>
import THead from './THead';
import filtering from './filtering';
import selection from './selection';
import sorting from './sorting';
import paging from './paging';
import grouping from './grouping';

import { removeObject } from '@/utils/array';
import { get } from '@/utils/object';
import { dasherize } from '@/utils/string';

// @TODO:
// Paging
// Fixed header/scrolling

// Data Flow:
// rows prop
// -> filteredRows (filtering.js)
// -> arrangedRows (sorting.js)
// -> pagedRows    (paging.js)
// -> groupedRows  (grouping.js)

export default {
  name:       'SortableTable',
  components: { THead },
  mixins:     [filtering, sorting, paging, grouping, selection],

  props: {
    headers: {
      // {
      //    name:   Name for the column (goes in query param)
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
      return this.$store.getters['selection/forTable'];
    }
  },

  methods: {
    get,
    dasherize,

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
            class="btn bg-primary"
            :disabled="!act.enabled"
            @click="applyTableAction(act)"
          >
            <i v-if="act.icon" :class="act.icon" />
            {{ act.label }}
          </button>
        </div>

        <div class="middle">
          <slot name="header-middle" />
        </div>

        <div v-if="search" class="search">
          <input v-model="searchQuery" type="search" class="input-sm" placeholder="Filter">
        </div>
      </div>
    </div>
    <table class="sortable-table" width="100%">
      <thead
        is="THead"
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
              There are no rows to show.
            </td>
          </tr>
        </slot>
      </tbody>
      <tbody v-else-if="noResults">
        <slot name="no-results">
          <tr>
            <td :colspan="fullColspan" class="no-results">
              There are no rows which match your search query.
            </td>
          </tr>
        </slot>
      </tbody>

      <tbody v-for="group in groupedRows" :key="group.key" :class="{ group: groupBy }">
        <slot v-if="groupBy" name="group-header" :group="group">
          <tr class="group-row">
            <td :colspan="fullColspan">
              <div class="group-tab">
                {{ group.ref }}
              </div>
            </td>
          </tr>
        </slot>
        <template v-for="row in group.rows">
          <slot name="main-row" :row="row">
            <tr :key="get(row,keyField)" class="main-row">
              <td v-if="tableActions" class="row-check" align="middle">
                <input type="checkbox" :data-node-id="get(row,keyField)" />
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
                  <td :key="col.name" :data-title="dt[col.name]" :align="col.align || 'left'" :class="{['col-'+dasherize(col.formatter||'')]: !!col.formatter}">
                    <slot :name="'cell:' + col.name" :row="row" :col="col">
                      <component :is="col.formatter" v-if="col.formatter" :value="get(row, col.value||col.name)" :row="row" :col="col" />
                      <template v-else>
                        {{ get(row, col.value||col.name) }}
                      </template>
                    </slot>
                  </td>
                </slot>
              </template>
              <td v-if="rowActions" align="middle">
                <slot name="row-actions" :row="row">
                  <button class="btn btn-sm bg-primary actions">
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
  </div>
</template>

<style lang="scss">
@import "@/assets/styles/base/_variables.scss";
@import "@/assets/styles/base/_functions.scss";
@import "@/assets/styles/base/_mixins.scss";
//
// Important: Almost all selectors in here need to be ">"-ed together so they
// apply only to the current table, not one nested inside another table.
//

$group-row-height: 40px;
$group-separation: 40px;
$divider-height: 2px;

.sortable-table {
  position: relative;
  table-layout: fixed;
  border-spacing: 0;
  width: 100%;

  > THEAD > TR > TH,
  > TBODY > TR > TD {
    padding: 0;
    transition: none;
    word-wrap: break-word;

    &:last-child {
      height: 0;
    }
  }

  > THEAD {
    background: var(--sortable-table-header-bg);

    > TR {
      width: 100%;
      box-sizing: border-box;
      outline: none;
      transition: none;

      > TH {
        border-width: 0 0 $divider-height 0;
        border-style: solid;
        border-color: var(--sortable-table-divider);
        border-radius: 0;
        outline: none;
        transition: none;
        color: var(--link-text);
        font-weight: normal;

        &.sortable {
          cursor: pointer;

          .text-right A {
            position: relative;
            left: -15px;
          }
        }

        &.check {
          position: relative;
          padding-left: 11px;
          cursor: pointer;
          user-select: none;
        }

        I.icon-sort, I[class*="icon-sort-"]{
          width: 15px;

          &.faded {
            opacity: .3;
          }
        }
      }
    }
  }

  > TBODY {
    border: none;

    &.group {
      &:before {
        content: "";
        display: block;
        height: 20px;
        background-color: var(--body-bg);
      }

      &:first-of-type:before {
        height: 0;
      }

      background: var(--sortable-table-accent-bg);

      .group-row {
        background-color: var(--body-bg);
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

    > TR > TD {
      height: $group-row-height;

      &.clip {
        padding-right: 25px;
      }

      &.row-expand, &.row-check {
        cursor: pointer;
      }

      .actions {
        padding: 5px;
      }
    }

    > TR.auto-height > TD,
    > TR.auto-height > TH {
      height: auto;
    }

    > TR.row-selected {
      background-color: var(--sortable-table-selected-bg);
    }

    > TR.separator-row > TD {
      background: var(--sortable-table-bg);
    }

    > TR.group-row > TD,
    > TR.total > TD {
      height: $group-row-height;
    }

    > TR.total > TD {
      background: var(--sortable-table-accent-bg);
    }
  }

  .fixed-header-widthinator {
    visibility: hidden;
    height: 0 !important;

    TH {
      border: 0 !important;
      padding: 0 !important;
      height: 0 !important;
    }
  }

  .double-rows > TBODY {
    > TR.main-row > TD {
      padding-bottom: 0;
      line-height: 15px;

      &.top-half {
        border-bottom: 1px solid transparent;
      }
    }

    > TR.sub-row > TD {
      padding-top: 0;
      border-bottom: solid thin var(--border);
    }
  }

  TH[align=left], TD[align=left] { text-align: left; }
  TH[align=center], TD[align=center] { text-align: center; }
  TH[align=right], TD[align=right] { text-align: right; }
}

.sortable-table-header {
  position: relative;
  z-index: z-index('fixedTableHeader');
}

.fixed-header-actions {
  padding: 0 0 5px 0;
  width: 100%;
  z-index: z-index('fixedTableHeader');
  background: var(--sortable-table-header-bg);
  display: grid;
  grid-template-columns: [bulk] auto [middle] min-content [search] minmax(min-content, 200px);
  grid-column-gap: 10px;

  .bulk {
    grid-area: bulk;

    BUTTON:not(:last-child) {
      margin-right: 10px;
    }
  }

  .middle {
    grid-area: middle;
    white-space: nowrap;
  }

  .search {
    grid-area: search;
  }
}
</style>
