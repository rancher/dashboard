import { SORT_BY, DESCENDING, PAGE } from '@/config/query-params';
import { sortBy } from '@/utils/sort';
import { addObject } from '@/utils/array';

export default {
  computed: {
    sortFields() {
      let fromGroup = ( this.groupBy ? this.groupSort || this.groupBy : null) || [];
      let fromColumn = [];

      const column = (this.columns || this.headers).find(x => x && x.name && x.name.toLowerCase() === this.sortBy.toLowerCase());

      if ( this.sortBy && column && column.sort ) {
        fromColumn = column.sort;
      }

      if ( !Array.isArray(fromGroup) ) {
        fromGroup = [fromGroup];
      }

      if ( !Array.isArray(fromColumn) ) {
        fromColumn = [fromColumn];
      }

      const out = [...fromGroup, ...fromColumn];

      addObject(out, 'nameSort');
      addObject(out, 'id');

      return out;
    },

    arrangedRows() {
      return sortBy(this.filteredRows, this.sortFields, this.descending);
    },
  },

  data() {
    let sortBy = null;
    let descending = false;

    const hasName = !!this.headers.find( x => x.name === 'name' );

    this._defaultSortBy = this.defaultSortBy;
    if ( !this._defaultSortBy ) {
      if ( hasName ) {
        this._defaultSortBy = 'name';
      } else {
        const first = this.headers.filter( x => x.name !== 'state' )[0];

        if ( first ) {
          this._defaultSortBy = first.name;
        } else {
          this._defaultSortBy = 'id';
        }
      }
    }

    sortBy = this.$route.query.sort;

    // If the sort column doesn't exist or isn't specified, use default
    if ( !sortBy || !this.headers.find(x => x.name === sortBy ) ) {
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

      this.$router.applyQuery({
        [SORT_BY]:    this.sortBy,
        [DESCENDING]: this.descending,
        [PAGE]:       this.currentPage,
      }, {
        [SORT_BY]:    this._defaultSortBy,
        [DESCENDING]: false,
        [PAGE]:       1,
      });
    },
  },
};
