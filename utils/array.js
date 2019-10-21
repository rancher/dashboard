export function removeObject(ary, obj) {
  const idx = ary.indexOf(obj);

  if ( idx >= 0 ) {
    ary.splice(idx, 1);
  }

  return ary;
}

export function removeObjects(ary, objs) {
  let i;
  let indexes = [];

  for ( i = 0 ; i < objs.length ; i++ ) {
    const idx = ary.indexOf(objs[i]);

    if ( idx !== -1 ) {
      indexes.push(idx);
    }
  }

  if ( !indexes.length ) {
    return ary;
  }

  // Indexes from highest to lowest
  indexes = indexes.sort((a, b) => b - a);

  const ranges = [];
  let first = indexes.shift();
  let last = first;
  let cur;

  while ( indexes.length ) {
    cur = indexes.shift();

    if ( last + 1 === cur ) {
      // Part of the same contiguous chunk
      last = cur;

      if ( indexes.length ) {
        // Keep looking for more if there's more items
        continue;
      }
    }

    // Not part of the same chunk
    ranges.push({ start: first, end: last });
    first = cur;
    last = null;
  }

  for ( i = 0 ; i < ranges.length ; i++ ) {
    const { start, end } = ranges[i];

    ary.splice(start, end - start + 1);
  }

  for ( let i = objs.length - 1 ; i >= 0 ; i-- ) {
    removeObject(ary, objs[i]);
  }

  return ary;
}

export function addObject(ary, obj) {
  const idx = ary.indexOf(obj);

  if ( idx === -1 ) {
    ary.push(obj);
  }
}

export function addObjects(ary, objs) {
  const unique = [];

  for ( let i = 0 ; i < objs.length ; i++ ) {
    if ( !ary.includes(objs[i]) ) {
      unique.push(objs[i]);
    }
  }

  ary.push(...unique);
}

export function insertAt(ary, idx, ...objs) {
  ary.splice(idx, 0, ...objs);
}

export function isArray(thing) {
  return Array.isArray(thing);
}

export function removeAt(ary, idx, len = 1) {
  if ( idx < 0 ) {
    throw new Error('Index too low');
  }

  if ( idx + len > ary.length ) {
    throw new Error('Index + length too high');
  }

  ary.splice(idx, len);

  return ary;
}

export function clear(ary) {
  ary.length = 0;
}

function findOrFilterBy(method, ary, keyOrObj, val) {
  ary = ary || [];

  if ( typeof keyOrObj === 'object' ) {
    return ary[method]((item) => {
      for ( const k in keyOrObj ) {
        if ( typeof keyOrObj[k] === 'undefined' ) {
          if ( !item[k] ) {
            return false;
          }
        } else if ( item[k] !== keyOrObj[k] ) {
          return false;
        }
      }

      return true;
    });
  } else if ( val === undefined ) {
    return ary[method](item => !!item[keyOrObj]);
  } else {
    return ary[method](item => item[keyOrObj] === val);
  }
}

export function filterBy(ary, keyOrObj, val) {
  return findOrFilterBy('filter', ary, keyOrObj, val);
}

export function findBy(ary, keyOrObj, val) {
  return findOrFilterBy('find', ary, keyOrObj, val);
}
