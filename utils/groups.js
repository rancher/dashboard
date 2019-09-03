import { ucFirst } from './string';
import { sortBy } from './sort';

export function groupsForCounts($router, counts, namespaces) {
  const clusterLevel = {};
  const namespaceLevel = {};

  counts.forEach((res) => {
    const namespaced = res.namespaced;
    let count, level, baseRoute, route;

    const name = mapGroup(res);
    const routerParams = {
      resource: name,
      id:       res.id
    };

    if ( namespaced ) {
      count = matchingCounts(res, namespaces);
      level = namespaceLevel;
      baseRoute = 'ns-resource';
      route = $router.resolve({ name: baseRoute, params: routerParams }).href;
    } else {
      count = res.count;
      level = clusterLevel;
      baseRoute = 'c-resource';
      route = $router.resolve({ name: baseRoute, params: routerParams }).href;
    }

    if ( count === 0 ) {
      return;
    }

    const group = ensureGroup(level, name, route);

    group.children.push({
      count,
      label: ucFirst(res.label),
      route: $router.resolve({ name: baseRoute, params: { resource: res.id } }).href,
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

  if ( group === 'rio.cattle.io' || group.endsWith('.rio.cattle.io') ) {
    return 'rio';
  }

  if ( group.endsWith('.cattle.io') ) {
    return 'rancher';
  }

  if ( group.endsWith('.istio.io') ) {
    return 'istio';
  }

  if ( group.endsWith('.knative.dev') ) {
    return 'knative';
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
  if ( group === 'rio' ) {
    return 1;
  }

  if ( group === 'apps' ) {
    return 2;
  }
  if ( group === 'core' ) {
    return 3;
  }

  return 99;
}
