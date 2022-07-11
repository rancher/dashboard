import { get } from '@shell/utils/object';

export default {
  computed: {
    groupedRows() {
      const groupKey = this.groupBy;
      const refKey = this.groupRef || groupKey;

      if ( !groupKey) {
        return [{
          key:  'default',
          ref:  'default',
          rows: this.pagedRows,
        }];
      }

      const out = [];
      const map = {};

      for ( const obj of this.pagedRows ) {
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

      // Do we have a set of groups that must always been shown?
      if (this.groups && this.groups.length) {
        this.groups.forEach((grp) => {
          const existing = map[grp.key];

          // Only add the group if not already present
          if (!existing) {
            out.push({
              key:          grp.key, // Unique key
              ref:          grp.ref, // Group object (by default requires 'nameDisplay' property)
              emptyMessage: grp.emptyMessage,
              rows:         []
            });
          } else {
            // If we have an existing group but no group ref, prefer the group ref from the provided groups
            // This ensures we don't see 'Not in a X' in these cases
            existing.ref = existing.ref || grp.ref;
          }
        });
      }

      return out;
    }
  }
};
