import { sortBy } from '@shell/utils/sort';
import { defaultSortBy, groupAndSort } from '@shell/mixins/resource-fetch-query';

export default {
  computed: {
    sortFields() {
      return groupAndSort(this);
    },

    arrangedRows() {
      if (this.setSortFn) {
        return this.rows;
      }

      let key;

      if ( this.sortGenerationFn ) {
        key = `${ this.sortGenerationFn.apply(this) }/${ this.rows.length }/${ this.sortDesc }/${ this.sortFields.join(',') }`;

        if ( this.cacheKey === key ) {
          return this.cachedRows;
        }
      }

      const out = sortBy(this.rows, this.sortFields);

      if ( key ) {
        this.cacheKey = key;
        this.cachedRows = out;
      }

      return out;
    },
  },

  data() {
    const sortBy = this.defaultSortBy || defaultSortBy({ headers: this.headers });

    this._defaultSortBy = sortBy;

    return {
      sortBy,
      sortDesc:   false,
      cachedRows: null,
      cacheKey:   null,
    };
  },

  methods: {
    changeSort(sort, desc) {
      if (this.setSortFn) {
        const [newSort, newDesc] = this.setSortFn(sort, desc);

        this.sortDesc = newDesc;
        this.sortBy = newSort;
      }
      if (!this.setSortFn) {
        this.sortBy = sort;
        this.sortDesc = desc;
        this.setPage(1);
      }
    },
  },
};
