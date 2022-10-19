import xor from 'lodash/xor';
import { get } from '@shell/utils/object';

export function removeObject<T>(ary: T[], obj: T): T[] {
  const idx = ary.indexOf(obj);

  if ( idx >= 0 ) {
    ary.splice(idx, 1);
  }

  return ary;
}

// this is a function that returns a filter function for use in the advanced worker
// ToDo: turns out I only need multiple fields and namespace filtering, I can take out the exclusion nonsense and multiple values per field
export const multiFieldFilter:Function = (searches: {field: String, string: String, exact?: Boolean}[]) => (resource: Object) => {
  let inclusionToken = false;
  let inclusions = 0;
  let exclusions = 0;

  for (const search of searches.filter(search => search.string)) {
    const searchTokens = search.string.split(', ');
    const exact = search.exact || false;
    const fieldValue = get(resource, search.field).trim().toLowerCase();

    for (const token of searchTokens) {
      const exclusionToken = token[0] === '!';

      inclusionToken = !exclusionToken || inclusionToken;
      const searchString = (exclusionToken ? token.substring(1) : token).trim().toLowerCase();

      if (!exclusionToken && exact ? fieldValue === searchString : fieldValue.includes(searchString)) { // ToDo: there's almost certainly a cleaner way to write this...
        inclusions++;
      } else if (exclusionToken && exact ? fieldValue === searchString : fieldValue.includes(searchString)) {
        exclusions++;
      }
    }
  }

  return (inclusions > 0 || inclusionToken === false) && exclusions === 0;
};

export function removeObjects<T>(ary: T[], objs: T[]): T[] {
  let i;
  let indexes = [];

  for ( i = 0 ; i < objs.length ; i++ ) {
    let idx = ary.indexOf(objs[i]);

    // Find multiple copies of the same value
    while ( idx !== -1 ) {
      indexes.push(idx);
      idx = ary.indexOf(objs[i], idx + 1);
    }
  }

  if ( !indexes.length ) {
    // That was easy...
    return ary;
  }

  indexes = indexes.sort((a, b) => a - b);

  const ranges = [];
  let first: number;
  let last: number;

  // Group all the indexes into contiguous ranges
  while ( indexes.length ) {
    first = indexes.shift() as number;
    last = first;

    while ( indexes.length && indexes[0] === last + 1 ) {
      last = indexes.shift() as number;
    }

    ranges.push({ start: first, end: last });
  }

  // Remove the items by range
  for ( i = ranges.length - 1 ; i >= 0 ; i--) {
    const { start, end } = ranges[i];

    ary.splice(start, end - start + 1);
  }

  return ary;
}

export function addObject<T>(ary: T[], obj: T): void {
  const idx = ary.indexOf(obj);

  if ( idx === -1 ) {
    ary.push(obj);
  }
}

export function addObjects<T>(ary: T[], objs: T[]): void {
  const unique: T[] = [];

  for ( const obj of objs ) {
    if ( !ary.includes(obj) && !unique.includes(obj) ) {
      unique.push(obj);
    }
  }

  ary.push(...unique);
}

export function insertAt<T>(ary: T[], idx: number, ...objs: T[]): void {
  ary.splice(idx, 0, ...objs);
}

export function isArray<T>(thing: T[] | unknown): boolean {
  return Array.isArray(thing);
}

export function removeAt<T>(ary: T[], idx: number, length = 1): T[] {
  if ( idx < 0 ) {
    throw new Error('Index too low');
  }

  if ( idx + length > ary.length ) {
    throw new Error('Index + length too high');
  }

  ary.splice(idx, length);

  return ary;
}

export function clear<T>(ary: T[]): void {
  ary.splice(0, ary.length);
}

export function replaceWith<T>(ary: T[], ...values: T[]): void {
  ary.splice(0, ary.length, ...values);
}

function findOrFilterBy<T, K, V>(
  method: 'filter', ary: T[] | null, keyOrObj: string | K, val?: V
): T[];
function findOrFilterBy<T, K, V>(
  method: 'find', ary: T[] | null, keyOrObj: string | K, val?: V
): T;
function findOrFilterBy<T, K, V>(
  method: keyof T[], ary: T[] | null, keyOrObj: string | K, val?: V
): T[] {
  ary = ary || [];

  if ( typeof keyOrObj === 'object' ) {
    return (ary[method] as Function)((item: T) => {
      for ( const path in keyOrObj ) {
        const want = keyOrObj[path];
        const have = get(item, path);

        if ( typeof want === 'undefined' ) {
          if ( !have ) {
            return false;
          }
        } else if ( have !== want ) {
          return false;
        }
      }

      return true;
    });
  } else if ( val === undefined ) {
    return (ary[method] as Function)((item: T) => !!get(item, keyOrObj));
  } else {
    return (ary[method] as Function)((item: T) => get(item, keyOrObj) === val);
  }
}

export function filterBy<T, K, V>(
  ary: T[] | null, keyOrObj: string | K, val?: V
): T[] {
  return findOrFilterBy('filter', ary, keyOrObj, val);
}

export function findBy<T, K, V>(
  ary: T[] | null, keyOrObj: string | K, val?: V
): T {
  return findOrFilterBy('find', ary, keyOrObj, val);
}

export function sameContents<T>(aryA: T[], aryB: T[]): boolean {
  return xor(aryA, aryB).length === 0;
}

export function uniq<T>(ary: T[]): T[] {
  const out: T[] = [];

  addObjects(out, ary);

  return out;
}

interface KubeResource { metadata: { labels: { [name: string]: string} } } // Migrate to central kube types resource when those are brought in
export function getUniqueLabelKeys<T extends KubeResource>(aryResources: T[]): string[] {
  const uniqueObj = aryResources.reduce((res, r) => {
    Object.keys(r.metadata.labels).forEach(l => (res[l] = true));

    return res;
  }, {} as {[label: string]: boolean});

  return Object.keys(uniqueObj).sort();
}
