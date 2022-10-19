import { sortBy } from '@shell/utils/sort';
import { addObject } from '@shell/utils/array';
import { isArray } from 'lodash';

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
      let key;

      if (this.setSortFn) {
        return this.rows;
      }

      if ( this.sortGenerationFn ) {
        key = `${ this.sortGenerationFn.apply(this) }/${ this.rows.length }/${ this.descending }/${ this.sortFields.join(',') }`;

        if ( this.cacheKey === key ) {
          return this.cachedRows;
        }
      }

      const out = sortBy(this.rows, this.sortFields, this.descending);

      if ( key ) {
        this.cacheKey = key;
        this.cachedRows = out;
      }

      return out;
    },
  },

  data() {
    let sortBy = null;

    this._defaultSortBy = this.defaultSortBy;

    // Try to find a reasonable default sort
    if ( !this._defaultSortBy ) {
      const markedColumn = this.headers.find(x => !!x.defaultSort);
      const nameColumn = this.headers.find( x => x.name === 'name');

      if ( markedColumn ) {
        this._defaultSortBy = markedColumn.name;
      } else if ( nameColumn ) {
        // Use the name column if there is one
        this._defaultSortBy = nameColumn.name;
      } else {
        // The first column that isn't state
        const first = this.headers.filter( x => x.name !== 'state' )[0];

        if ( first ) {
          this._defaultSortBy = first.name;
        } else {
          // I give up
          this._defaultSortBy = 'id';
        }
      }
    }

    // If the sort column doesn't exist or isn't specified, use default
    if ( !sortBy || !this.headers.find(x => x.name === sortBy ) ) {
      sortBy = this._defaultSortBy;
    }

    return {
      sortBy,
      descending: false,
      cachedRows: null,
      cacheKey:   null,
    };
  },

  methods: {
    changeSort(sort, desc) {
      if (this.setSortFn) {
        const realSort = this.headers.find(header => header.name === sort).sort || '';
        const realDesc = realSort.includes(':desc') ? !desc : desc;
        let correctedSort = realSort;

        // ToDo: these if blocks are some hot garbage but they'll have to do for now...
        if (realSort === 'creationTimestamp:desc' || realSort === 'namespace') { // ToDo: everybody hates one-off cases
          correctedSort = `metadata.${ realSort.replace(':desc', '') }`;
        }
        if (isArray(realSort)) {
          correctedSort = realSort[0].replace('$.', '').replace('[', '.').replace(']', '');
        }

        this.setSortFn(`${ realDesc ? '-' : '' }${ correctedSort }`);
      }
      this.sortBy = sort;
      this.descending = desc;

      // Always go back to the first page when the sort is changed
      if (!this.setSortFn) {
        this.setPage(1);
      }
    },
  },
};
