import { SORT_BY, DESCENDING, PAGE } from './query.js';
import sortBy from '~/utils/sort';

export default {
  computed: {
    sortFields() {
      let fromGroup = this.groupSort || [];
      let fromColumn = [];

      const column = this.columns.find(x => x && x.name && x.name.toLowerCase() === this.sortBy.toLowerCase());

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

    arrangedRows() {
      return sortBy(this.filteredRows, this.sortFields, this.descending);
    },

    displayGroups() {
      const out = [];

      for ( let i = 0 ; i < this.displayRows.length ; i++ ) {
        out.push({
          key:  i,
          name: `Group ${ i }`,
          rows: [this.displayRows[i]],
        });
      }

      return out;
    },
  },

  data: () => ({
    sortBy:        null,
    descending:    false,
  }),

  methods: {
    changeSort(sort, desc) {
      this.sortBy = sort;
      this.descending = desc;
      this.currentPage = 1;

      this.updateQuery({
        [SORT_BY]:    this.sortBy,
        [DESCENDING]: this.descending,
        [PAGE]:       this.currentPage,
        _defaultSort: this._defaultSort
      });
    },
  },

  created() {
    const hasName = !!this.columns.find( x => x.name === 'name' );

    this._defaultSortBy = this.defaultSortBy;
    if ( !this._defaultSortBy ) {
      if ( hasName ) {
        this._defaultSortBy = 'name';
      } else {
        this._defaultSortBy = this.columns.filter( x => x.name !== 'state' )[0].name;
      }
    }

    this.sortBy = this.$route.query.sort;

    // If the sort column doesn't exist or isn't specified, use default
    if ( !this.sortBy || !this.columns.find(x => x.name === this.sortBy ) ) {
      this.sortBy = this._defaultSortBy;
    }

    this.descending = (typeof this.$route.query.desc) !== 'undefined';
  },

};
