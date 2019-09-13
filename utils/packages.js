import { ucFirst } from './string';
import { sortBy } from './sort';
import { findBy } from './array';
import { CONFIG_MAP, RIO, SECRET } from './types';

export function rioPackage($router, counts, namespaces) {
  function countFor(type) {
    const entry = findBy(counts, 'id', type);

    if ( !entry ) {
      return 0;
    }

    return matchingCounts(entry, namespaces);
  }

  function linkFor(resource) {
    return $router.resolve({
      name:   'rio-resource',
      params: { resource }
    }).href;
  }

  const out = {
    name:     'rio',
    label:    'Rio',
    children: [
      {
        name:    'rio-dashboard',
        label:   'Dashboard',
        route:   linkFor('dashboard'),
      },
      {
        name:    'rio-graph',
        label:   'App Mesh',
        route:   linkFor('mesh'),
      },
      {
        name:    'rio-tap',
        label:   'Live Traffic Tap',
        route:   linkFor('tap'),
      },
      { divider: true },
      {
        name:    'rio-apps',
        count:   countFor(RIO.APP),
        label:   'Apps & Versions',
        route:   linkFor('apps'),
      },
      {
        name:  'rio-riofiles',
        count: countFor(RIO.RIOFILE),
        label: 'Riofiles',
        route: linkFor('riofiles'),
      },
      {
        name:    'rio-routers',
        count:   countFor(RIO.ROUTER),
        label:   'Routers',
        route:   linkFor('routers'),
      },
      { divider: true },
      {
        name:  'rio-config-maps',
        count: countFor(CONFIG_MAP),
        label: 'Config Maps',
        route: linkFor('config-maps'),
      },
      {
        name:  'rio-external-services',
        count: countFor(RIO.EXTERNAL_SERVICE),
        label: 'External Services',
        route: linkFor('external-services'),
      },
      {
        name:  'rio-public-domains',
        count: countFor(RIO.PUBLIC_DOMAIN),
        label: 'Public Domains',
        route: linkFor('public-domains'),
      },
      {
        name:  'rio-secrets',
        count: countFor(SECRET),
        label: 'Secrets',
        route: linkFor('secrets'),
      },
    ],
  };

  return out;
}

export function explorerPackage($router, counts, namespaces) {
  const level = {};

  counts.forEach((res) => {
    const namespaced = res.namespaced;
    let count, prefix;

    const name = mapGroup(res);

    if ( namespaced ) {
      count = matchingCounts(res, namespaces);
      prefix = 'ns';
    } else {
      count = res.count;
      prefix = 'c';
    }

    if ( count === 0 ) {
      return;
    }

    const group = ensureGroup(level, name, prefix);

    group.children.push({
      count,
      namespaced,
      name:  `${ prefix }_${ name }`,
      icon:  (namespaced ? 'icon-folder' : 'icon-copy'),
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

  for ( const group of Object.keys(level) ) {
    if ( level[group] && level[group].children ) {
      level[group].children = sortBy(level[group].children, 'label');
    }
  }

  const out = {
    name:     'explorer',
    label:    'Explorer',
    children: sortBy(Object.values(level), ['priority', 'namespaced', 'label']),
  };

  return out;
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

  if ( !group || group === 'core' ) {
    return 'core';
  }

  if ( group.match(/^api.*.k8s.io/) ) {
    return 'api';
  }

  if ( group === 'rio.cattle.io' || group.endsWith('.rio.cattle.io') ) {
    return 'rio';
  }

  if ( group === 'longhorn.rancher.io' || group.endsWith('.longhorn.rancher.io') ) {
    return 'longhorn';
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
    return 'Cert Manager';
  case 'admissionregistration.k8s.io':
    return 'Admission Registration';
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
