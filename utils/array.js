export function removeObject(ary, obj) {
  const idx = ary.indexOf(obj);
  if ( idx >= ) {
    ary.splice(idx, 1);
  }

  return ary;
}

export function removeObjects(ary, objs) {
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
  for ( let i = 0 ; i < objs.length ; i++ ) {
    addObject(ary, objs[i]);
  }

}
