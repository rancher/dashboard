import { ucFirst } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import { findBy } from '@/utils/array';
import { CONFIG_MAP, RIO, SECRET } from '~/config/types';
// import config from '@/nuxt.config';

let routerBase = null;

if ( typeof process.env.ROUTER_BASE !== 'undefined' ) {
  routerBase = process.env.ROUTER_BASE;

  if ( routerBase.endsWith('/') ) {
    routerBase = routerBase.replace(/\/$/, '');
  }
}

export function rioPackage($router, counts, namespaces) {
  function countFor(type) {
    const entry = findBy(counts, 'id', type);

    if ( !entry ) {
      return 0;
    }

    return matchingCounts(entry, namespaces);
  }

  function linkFor(resource) {
    return {
      name:   'rio-resource',
      params: { resource }
    };
  }

  const out = {
    name:     'rio',
    label:    'Rio',
    children: [
      /*
      {
        name:    'rio-dashboard',
        label:   'Dashboard',
        route:   { name: 'rio-dashboard' },
      },
      {
        name:    'rio-tap',
        label:   'Live Traffic Tap',
        route:   { name: 'rio-tap' },
      },
      */
      {
        name:    'rio-graph',
        label:   'App Mesh',
        route:   { name: 'rio-mesh' },
      },
      {
        name:  'rio-stack',
        count: countFor(RIO.STACK),
        label: 'Stacks',
        route: linkFor('stack'),
      },
      { divider: true },
      {
        name:    'rio-services',
        count:   countFor(RIO.SERVICE),
        label:   'Services',
        route:   linkFor('services'),
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

  function linkFor(group, resource) {
    return {
      name:   'explorer-group-resource',
      params: { group, resource }
    };

    /*
    return resolve($router, 'explorer-group-resource', {
      group,
      resource,
    });
    */
  }

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
      name:  `${ prefix }_${ name }_${ res.id }`,
      icon:  (namespaced ? 'icon-folder' : 'icon-copy'),
      label: ucFirst(res.label),
      route: linkFor(name, res.id),
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
    };
    level[name] = group;
  }

  return group;
}

function matchingCounts(obj, namespaces) {
  const allNegative = namespaces.filter(x => x.startsWith('!')).length === namespaces.length;
  let out = 0;

  if ( !obj.byNamespace ) {
    return 0;
  }

  if ( allNegative ) {
    out = obj.count;

    for ( let i = 0 ; i < namespaces.length ; i++ ) {
      out -= obj.byNamespace[namespaces[i].substr(1)] || 0;
    }

    return out;
  }

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

  if ( group.match(/^api.*\.k8s\.io/) ) {
    return 'api';
  }

  if ( group === 'cloud.rio.rancher.io' ) {
    return 'cloud';
  }

  if ( group.match(/^(.+\.)?cert-manager.io/) || group === 'certmanager.k8s.io' ) {
    return 'cert-manager';
  }

  if ( group.match(/gateway.solo.io(.v\d+)?$/) || group === 'gloo.solo.io' ) {
    return 'gloo';
  }

  if ( group.endsWith('.tekton.dev') || group === 'tekton.dev' ) {
    return 'tekton';
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
  case 'cert-manager':
    return 'Cert Manager';
  case 'admissionregistration.k8s.io':
    return 'Admission Registration';
  }

  if ( group.endsWith('.k8s.io') ) {
    group = group.replace(/\.k8s\.io$/, '');
  }

  return group.split(/\./).map(x => ucFirst(x)).join('.');
}
