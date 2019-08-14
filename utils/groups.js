import { ucFirst } from './string';

export default function groupsForCounts(counts, namespaces) {
  const groups = {};

  counts.forEach((res) => {
    const count = matchingCounts(res, namespaces);

    if ( count === 0 ) {
      return;
    }

    const name = mapGroup(res.group);
    let group = groups[name];

    if ( !groups[name] ) {
      group = {
        name,
        route:    '/explorer',
        label:    groupLabel(name),
        children: [],
        priority: groupPriority(name),
      };
      groups[name] = group;
    }

    group.children.push({
      label: res.label,
      route: `/explorer/${ res.id }/`,
      count,
    });
  });

  return groups;
}

function matchingCounts(obj, namespaces) {
  if ( namespaces.includes('_all') ) {
    return obj.count;
  }

  if ( !obj.byNamespace ) {
    return 0;
  }

  let out = 0;

  for ( let i = 0 ; i < namespaces.length ; i++ ) {
    out += obj.byNamespace[namespaces[i]] || 0;
  }

  return out;
}

function mapGroup(group) {
  if ( !group ) {
    group = 'core';
  }

  if ( group === 'core' || group === 'apps' ) {
    group = 'core';
  }

  return group;
}

function groupLabel(group) {
  if ( group.endsWith('.k8s.io') ) {
    return group.replace(/\.k8s\.io$/, '').split(/\./).map(x => ucFirst(x)).join('.');
  }

  if ( !group.includes('.') ) {
    return ucFirst(group);
  }

  return group;
}

function groupPriority(group) {
  if ( group === 'core' ) {
    return 1;
  }

  if ( group === 'apps' ) {
    return 2;
  }

  if ( !group.includes('.') ) {
    return 3;
  }

  if ( group.endsWith('.k8s.io') ) {
    return 4;
  }

  return 5;
}
