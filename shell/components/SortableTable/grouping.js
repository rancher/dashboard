import { get } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';

export default {
  computed: {
    /**
     * The group config associated with the selected group
     */
    selectedGroupOption() {
      return this.groupOptions?.find((go) => go.value === this.group);
    },

    groupedRows() {
      const groupKey = this.groupBy;
      const refKey = this.groupRef || this.selectedGroupOption?.groupLabelKey || groupKey;
      let rowsToProcess = [];

      if (this.pagedRows.length > 0 ) {
        rowsToProcess = [...this.pagedRows];
      }
      // else{
      //  rowsToProcess = [...this.rows];
      // }
      const outRows = sortBy(rowsToProcess, this.sortFields, this.descending);

      if ( !groupKey) {
        return [{
          key:  'default',
          ref:  'default',
          rows: outRows,
        }];
      }

      const out = [];
      const map = {};

      for ( const obj of outRows ) {
        const key = get(obj, groupKey) || '';
        const ref = get(obj, refKey);
        let entry = map[key];

        if ( entry ) {
          entry.rows.push(obj);
        } else {
          entry = {
            key,
            ref,
            rows: [obj]
          };
          map[key] = entry;
          out.push(entry);
        }
      }

      return out;
    }
  }
};
