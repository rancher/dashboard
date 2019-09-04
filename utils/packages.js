import { ucFirst } from './string';
import { sortBy } from './sort';

export function explorerPackage($router, counts, namespaces) {
  const clusterLevel = {};
  const namespaceLevel = {};

  counts.forEach((res) => {
    const namespaced = res.namespaced;
    let count, level, prefix;

    const name = mapGroup(res);

    if ( namespaced ) {
      count = matchingCounts(res, namespaces);
      level = namespaceLevel;
      prefix = 'ns';
    } else {
      count = res.count;
      level = clusterLevel;
      prefix = 'c';
    }

    if ( count === 0 ) {
      return;
    }

    const group = ensureGroup(level, name, prefix);

    group.children.push({
      count,
      name:  `${ prefix }_${ name }`,
      label: ucFirst(res.label),
      route: $router.resolve({
        name:   'explorer-group-resource',
        params: {
          group:    name,
          resource: res.id
        }
      }).href,
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
    name:        'explorer',
    label:       'Resource Explorer',
    collections: [
      {
        name:     'ns',
        label:    'Namespaced Resources',
        groups: sortBy(Object.values(namespaceLevel), ['priority', 'label'])
      },
      {
        name:     'c',
        label:    'Cluster Resources',
        groups: sortBy(Object.values(clusterLevel), ['priority', 'label'])
      },
    ]
  };
}

export function rioPackage($router, counts, namespaces) {
  return {
    name:  'rio',
    label: 'Rio',
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

export function mapGroup(obj) {
  const group = obj.group;

  if ( !group || group === 'core' || group === 'apps' ) {
    return 'core';
  }

  if ( group.match(/^api.*.k8s.io/) ) {
    return 'api';
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
  switch (group ) {
  case 'api':
    return 'API';
  case 'rbac.authorization.k8s.io':
    return 'RBAC';
  case 'certmanager.k8s.io':
    return 'CertManager';
  }

  if ( group.endsWith('.k8s.io') ) {
    group = group.replace(/\.k8s\.io$/, '');
  }

  return group.split(/\./).map(x => ucFirst(x)).join('.');
}

function groupPriority(group) {
  if ( group === 'apps' ) {
    return 1;
  }
  if ( group === 'core' ) {
    return 2;
  }

  return 99;
}
