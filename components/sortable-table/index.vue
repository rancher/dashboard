<script>

import THead, { NONE, SOME, ALL } from './THead';
import sortBy from '~/utils/sort';

// Selection
// Bulk actions
// Paging
// Sorting
// Filtering
// Fixed scrolling
export default {
  name: 'SortableTable',

  components: { THead },

  props: {
    columns: {
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
      type:     Array,
      required: true
    },
    keyField: {
      type:     String,
      required: true,
    },

    groupBy: {
      type:    String,
      default: null
    },
    groupBySort: {
      type:    String,
      default: null
    },

    initialSortBy: {
      type:    String,
      default: null
    },
    initialDescending: {
      type:    Boolean,
      default: false,
    },

    tableActions: {
      type:    Boolean,
      default: true
    },
    checkWidth: {
      type:     Number,
      default:  40,
    },

    multiPageSelectAll: {
      type:    Boolean,
      default: true,
    },

    rowActions: {
      type:    Boolean,
      default: true
    },
    rowActionsWidth: {
      type:    Number,
      default: 40
    },

    search: {
      type:    Boolean,
      default: true
    },
    initialSearchQuery: {
      type:    String,
      default: ''
    }
  },

  data: () => ({
    currentPage:   1,
    selectedNodes: [],
    sortBy:        null,
    descending:    null,
    searchQuery:   null,
  }),

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

      if ( this.rowActions ) {
        span++;
      }

      return span;
    },

    noResults() {
      return !!this.searchQuery && this.displayRows.length === 0;
    },

    noRows() {
      return !this.noResults && this.rows.length === 0;
    },

    sortFields() {
      let fromGroup = this.groupBySort || [];
      let fromColumn = [];
      const column = this.columns.find(x => x.name.toLowerCase() === this.sortBy.toLowerCase());

      if ( this.sortBy && column && column.sort ) {
        fromColumn = column.sort;
      }

      if ( !Array.isArray(fromGroup) ) {
        fromGroup = [fromGroup];
      }

      if ( !Array.isArray(fromColumn) ) {
        fromColumn = [fromColumn];
      }

      return [...fromGroup, ...fromColumn];
    },

    displayRows() {
      // rows -> filtered -> arranged -> paged
      const out = this.rows.slice();

      return sortBy(out, this.sortFields, this.descending);
    },

    displayGroups() {
      const out = [];

      for ( let i = 0 ; i < this.displayRows.length ; i++ ) {
        out.push({
          key:  i,
          name: `Group ${ i }`,
          rows: [this.rows[i]],
        });
      }

      return out;
    },

    selection() {
      const total = this.displayRows.length;
      const selected = this.selectedNodes.length;

      if ( selected >= total ) {
        return ALL;
      } else if ( selected > 0 ) {
        return SOME;
      }

      return NONE;
    },

    keyFieldInRow() {
      return `row.${ this.keyField }`;
    }
  },

  created() {
    if ( !this.sortBy ) {
      this.sortBy = this.initialSortBy || this.columns[0].name;
    }

    if ( this.initialDescending === undefined ) {
      this.descending = false;
    } else {
      this.descending = this.initialDescending;
    }
  },

  methods: {
    changeSort(field, desc) {
      console.log(`sortChanged(${ field }, ${ desc })`);
      this.sortBy = field;
      this.descending = desc;
      this.currentPage = 1;
    },

    selectAll() {
    }
  }
};
</script>

<template>
  <div>
    <table class="sortable-table" width="100%">
      <thead
        is="THead"
        :columns="columns"
        :table-actions="tableActions"
        :check-width="checkWidth"
        :row-actions="rowActions"
        :row-actions-width="rowActionsWidth"
        :selection="selection"
        :sort-by="sortBy"
        :descending="descending"
        @on-select-all="selectAll"
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

      <template v-if="groupBy">
        <tbody v-for="group in displayGroups" :key="group.key">
          <tr slot="group-header">
            <td :colspan="fullColspan">
              {{ group.name }}
            </td>
          </tr>
          <tr v-for="row in group.rows" :key="row[keyField]">
            <td v-if="tableActions">
              Checkbox
            </td>
            <td v-for="(cell, idx) in row.cells" :key="idx">
              {{ cell }}
            </td>
            <td v-if="rowActions">
              Act
            </td>
          </tr>
        </tbody>
      </template>

      <template v-else>
        <tbody>
          <tr v-for="row in rows" :key="row.object.metadata.uid">
            <td v-if="tableActions">
              Checkbox
            </td>
            <td v-for="(cell, idx) in row.cells" :key="idx">
              {{ cell }}
            </td>
            <td v-if="rowActions">
              Act
            </td>
          </tr>
        </tbody>
      </template>
    </table>
  </div>
</template>

<style lang="scss" scoped>
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

  TH {
    text-align: left;
  }

  > THEAD > TR > TH,
  > TBODY > TR > TD {
    padding: 0;
    transition: none;
    word-wrap: break-word;

    &:last-child {
      height: 0;
    }
  }

  > TBODY > TR > TD {
    height: $group-row-height;

    &.clip {
      padding-right: 25px;
    }
  }

  > TBODY > TR.auto-height > TD,
  > TBODY > TR.auto-height > TH {
    height: auto;
  }

  .fixed-header {
    background: var(--sortable-table-header-bg);

    > TH {
      text-align: left;

      &.check {
        position: relative;
        padding-left: 11px;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      &.sortable.text-right A {
        position: relative;
        left: -15px;
      }

      a {
        padding: 0;

        I.faded {
          opacity: .3;
        }

        I.icon-sort {
          width: 15px;
        }
      }
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

  .check, .actions, .toggle {
    text-align: center;
    cursor: pointer;
  }

  // &.has-sub-rows {
  //   tr.row-selected TABLE > TBODY > TR > TD {
  //     background: var(--sortable-table-bg);
  //   }

  //   tr.row-selected .btn-group.bg-default {
  //     background: darken($bg-default, 7);
  //   }

  //   tr.row-selected .scale-arrow:before {
  //     border-bottom-color: darken($bg-default, 7);
  //   }

  //   TABLE {
  //     > TBODY {
  //       @include striped;
  //     }
  //   }
  //   TABLE > THEAD > .fixed-header-actions {
  //     z-index: 3;
  //     background-color: transparent;
  //   }
  //   TABLE > THEAD > .fixed-header {
  //     z-index: 4;
  //   }
  //   TABLE .bulk-actions {
  //     margin: 0 18px;
  //   }
  // }

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

      // .main-row TD {
      //   border-bottom: solid thin var(--border);
      // }
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

  > THEAD > TR {
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: none;

    &.fixed-header {
      background: var(--sortable-table-header-bg);

      TH {
        color: var(--link-text);

        .btn {
          color: var(--link-text);
        }
      }
    }

    > TH {
      border-width: 0 0 $divider-height 0;
      border-style: solid;
      border-color: var(--sortable-table-divider);
      border-radius: 0;
      outline: none;
      transition: none;
      text-align: left;
      font-weight: normal;
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
}

.header {
  position: relative;
  z-index: z-index('fixedTableHeader');

}

.fixed-header-actions {
  padding: 5px 11px;
  width: 100%;
  z-index: z-index('fixedTableHeader');
  background: var(--sortable-table-header-bg);
  display: grid;
  grid-template-columns: [bulk] auto [search] minmax(min-content, 200px) [right] min-content;
  grid-column-gap: 20px;

  .bulk {
    grid-area: bulk;
  }

  .search {
    grid-area: search;
  }

  .right {
    grid-area: right;
    white-space: nowrap;
  }
}

.yes-clip {
  .maybe-clip {
    @extend .clip;
  }
}
</style>
