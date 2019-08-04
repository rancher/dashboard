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
  },

  data() {
    let sortBy = null;
    let descending = false;

    const hasName = !!this.columns.find( x => x.name === 'name' );

    console.log(1, hasName);
    this._defaultSortBy = this.defaultSortBy;
    console.log(2, this._defaultSortBy);
    if ( !this._defaultSortBy ) {
      console.log(3, this._defaultSortBy);
      if ( hasName ) {
        this._defaultSortBy = 'name';
        console.log(4, this._defaultSortBy);
      } else {
        this._defaultSortBy = this.columns.filter( x => x.name !== 'state' )[0].name;
        console.log(5, this._defaultSortBy);
      }
    }

    console.log(6, this._defaultSortBy);
    sortBy = this.$route.query.sort;

    // If the sort column doesn't exist or isn't specified, use default
    if ( !sortBy || !this.columns.find(x => x.name === sortBy ) ) {
      sortBy = this._defaultSortBy;
    }

    descending = (typeof this.$route.query.desc) !== 'undefined';

    return {
      sortBy,
      descending
    };
  },

  methods: {
    changeSort(sort, desc) {
      this.sortBy = sort;
      this.descending = desc;
      this.currentPage = 1;

      this.updateQueryString({
        [SORT_BY]:    this.sortBy,
        [DESCENDING]: this.descending,
        [PAGE]:       this.currentPage,
        _defaultSort: this._defaultSort
      });
    },
  },
};
