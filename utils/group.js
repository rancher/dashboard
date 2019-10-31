import { get } from '@/utils/object';
import { filterBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';

// groupAndFilterBy(services, 'default')
export function groupAndFilterOptions(ary, filterValue, {
  filterKey = 'metadata.namespace',

  groupKey = 'metadata.namespace',
  groupPrefix = 'Namespace: ',

  itemLabelKey = 'nameDisplay',
  itemValueKey = 'id',
  itemSortKey = 'nameSort',
} = {}) {
  let matching;

  if ( filterKey && filterValue ) {
    matching = filterBy((ary || []), filterKey, filterValue);
  } else {
    matching = ary;
  }

  const groups = {};

  for ( const match of matching ) {
    const name = get(match, groupKey);
    let entry = groups[name];

    if ( !entry ) {
      entry = {
        group: `${ groupPrefix }${ name }`,
        items: [],
      };
      groups[name] = entry;
    }

    entry.items.push({
      obj:   match,
      label: get(match, itemLabelKey),
      value: get(match, itemValueKey),
    });
  }

  const out = Object.keys(groups).map((name) => {
    const entry = groups[name];

    entry.items = sortBy(entry.items, `obj.${ itemSortKey }`);

    return entry;
  });

  return sortBy(out, 'group');
}
