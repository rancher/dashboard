import { ucFirst } from './string';
import { sortBy } from './sort';

export function groupsForCounts(counts, namespaces) {
  const clusterLevel = {};
  const namespaceLevel = {};

  counts.forEach((res) => {
    const namespaced = res.namespaced;
    let count, level, route;

    if ( namespaced ) {
      count = matchingCounts(res, namespaces);
      level = namespaceLevel;
      route = '/ns';
    } else {
      count = res.count;
      level = clusterLevel;
      route = '/c';
    }

    if ( count === 0 ) {
      return;
    }

    const name = mapGroup(res);
    const group = ensureGroup(level, name, route);

    group.children.push({
      label: res.label,
      route: `${ route }/${ res.id }/`,
      count,
    });
  });

  for ( const level of [clusterLevel, namespaceLevel]) {
    for ( const group of Object.keys(level) ) {
      if ( level[group] && level[group].children ) {
        level[group].children = sortBy(level[group].children, 'label');
      }
    }
  }

  return {
    clusterLevel:   sortBy(Object.values(clusterLevel), ['priority', 'label']),
    namespaceLevel: sortBy(Object.values(namespaceLevel), ['priority', 'label']),
  };
}

function ensureGroup(level, name, route) {
  let group = level[name];

  if ( !level[name] ) {
    group = {
      name,
      route,
      label:    groupLabel(name),
      children: [],
      priority: groupPriority(name),
    };
    level[name] = group;
  }

  return group;
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

  if ( !group || group === 'core' || group === 'apps' ) {
    return 'core';
  }

  if ( group.endsWith('.cattle.io') ) {
    return 'rancher';
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

  if ( group.endsWith('.k8s.io') ) {
    return 5;
  }

  return 6;
}
