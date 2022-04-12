import { get } from '@shell/utils/object';
import { filterBy } from '@shell/utils/array';
import { sortBy } from '@shell/utils/sort';

const NOT_GROUPED = 'none';

// groupAndFilterBy(services, 'default')
export function groupAndFilterOptions(ary, filter, {
  defaultFilterKey = 'metadata.namespace',

  groupBy = 'metadata.namespace',
  groupPrefix = 'Namespace: ',

  itemLabelKey = 'nameDisplay',
  itemValueKey = 'id',
  itemSortKey = 'nameSort',
} = {}) {
  let matching;

  if ( filter && typeof filter === 'object' ) {
    matching = filterBy((ary || []), filter);
  } else if ( filter ) {
    // If you want to filter on a value that's false-y (false, null, undefined) use the object version of filter
    matching = filterBy((ary || []), defaultFilterKey, filter);
  } else {
    matching = ary;
  }

  const groups = {};

  for ( const match of matching ) {
    const name = groupBy ? get(match, groupBy) : NOT_GROUPED;
    let entry = groups[name];

    if ( !entry ) {
      entry = {
        group: `${ groupPrefix }${ name }`,
        items: {},
      };

      groups[name] = entry;
    }

    const value = get(match, itemValueKey);

    if ( !entry.items[value] ) {
      entry.items[value] = {
        obj:   match,
        label: get(match, itemLabelKey),
        value
      };
    }
  }

  const out = Object.keys(groups).map((name) => {
    const entry = groups[name];

    entry.items = sortBy(Object.values(entry.items), `obj.${ itemSortKey }`);

    return entry;
  });

  if ( groupBy ) {
    return sortBy(out, 'group');
  } else if ( out.length ) {
    return out[0].items;
  } else {
    return [];
  }
}
