import { ucFirst } from './string';
import { sortBy } from './sort';

export function groupsForCounts(counts, namespaces) {
  const groups = {};

  counts.forEach((res) => {
    const namespaced = res.namespaced;
    const count = namespaced ? matchingCounts(res, namespaces) : res.count;

    if ( count === 0 ) {
      return;
    }

    const name = mapGroup(res);
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

  for ( const group of Object.keys(groups) ) {
    if ( groups[group] && groups[group].children ) {
      groups[group].children = sortBy(groups[group].children, 'label');
    }
  }

  return groups;
}

function matchingCounts(obj, namespaces) {
  if ( namespaces.length === 0 ) {
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

function mapGroup(obj) {
  const group = obj.group;

  if ( !obj.namespaced && !group ) {
    return 'cluster';
  }

  if ( !group || group === 'core' || group === 'apps' ) {
    return 'core';
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
  if ( group === 'cluster' ) {
    return 0;
  }

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
