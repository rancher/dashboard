<script>
// Selection
// Bulk actions
// Paging
// Sorting
// Filtering
// Fixed scrolling
export default {
  props: {
    columns: {
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

    sortBy: {
      type:    String,
      default: null
    },
    descending: {
      type:    Boolean,
      default: false,
    },

    tableActions: {
      type:    Boolean,
      default: true
    },
    pagedSelectAll: {
      type:    Boolean,
      default: true,
    },

    rowActions: {
      type:    Boolean,
      default: true
    },

    search: {
      type:    Boolean,
      default: true
    },
    searchQuery: {
      type:    String,
      default: ''
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

      if ( this.rowActions ) {
        span++;
      }

      return span;
    },

    noResults() {
      return !!this.searchQuery && this.displayRows.length === 0;
    },

    noRows() {
      return !this.noResults() && this.rows.length === 0;
    },

    displayRows() {
      return this.rows;
    },

    displayGroups() {
      const out = [];

      for ( let i = 0 ; i < this.rows.length ; i++ ) {
        out.push({
          key:  i,
          name: `Group ${ i }`,
          rows: [this.rows[i]],
        });
      }

      return out;
    }
  }
};
</script>

<template>
  <div>
    <table width="100%">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.name" align="left">
            {{ col.name }}
          </th>
        </tr>
      </thead>

      <tbody v-if="noRows">
        <tr slot="no-rows">
          <td :colspan="fullColspan" class="no-rows">
            There are no rows to show.
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="noResults">
        <tr slot="no-rows">
          <td :colspan="fullColspan" class="no-rows">
            There are no rows to show.
          </td>
        </tr>
      </tbody>

      <template v-if="groupBy">
        <tbody v-for="group in displayGroups" :key="group.key">
          <tr slot="group-header">
            <td :colspan="fullColspan">
              {{ group.name }}
            </td>
          </tr>
          <tr><td>Grouped</td></tr>
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

</style>
