import { sortBy } from '@/utils/sort';
import { SCHEMA, COUNT } from '@/config/types';
import {
  isBasic,
  isIgnored,
  singularLabelFor,
  groupLabelFor,
  typeWeightFor,
  groupWeightFor,
  virtualTypes,
} from '@/utils/customized';

export function allTypes($store) {
  if ( !$store.getters['cluster/haveAll'](COUNT) || !$store.getters['cluster/haveAll'](SCHEMA) ) {
    return null;
  }

  const schemas = $store.getters['cluster/all'](SCHEMA);
  const counts = $store.getters['cluster/all'](COUNT)[0].counts;
  const out = [];

  for ( const schema of schemas ) {
    const attrs = schema.attributes || {};
    const count = counts[schema.id];
    const group = attrs.group;

    if ( !attrs.kind ) {
      // Skip the apiGroups resource
      continue;
    }

    if ( isIgnored(schema) ) {
      // Skip ignored groups & types
      continue;
    }

    out.push({
      schema,
      group,
      id:          schema.id,
      label:       singularLabelFor(schema),
      namespaced:  attrs.namespaced,
      count:       count ? count.count : 0,
      byNamespace: count ? count.namespaces : {},
      revision:    count ? count.revision : null,
    });
  }

  return out;
}

export function getTree(mode, clusterId, types, namespaces, currentType) {
  const root = {};

  for ( const typeObj of types ) {
    const namespaced = typeObj.namespaced;
    const count = matchingCounts(typeObj, namespaces);

    const allNegative = allNegativeFilters(namespaces);

    if ( typeObj.id === currentType ) {
      // If this is the type currently being shown, always show it
    } else if ( !namespaced && namespaces.length && !allNegative ) {
      // If a namespace filter is specified, hide non-namespaced resources.
      continue;
    } else if ( count === 0 && mode === 'used') {
      // If there's none of this type, ignore this entry when viewing only in-use types
      continue;
    } else if ( mode === 'basic' && !isBasic(typeObj.schema) ) {
      // If the mode is basic, ignore this entry unless it's a basic type
      continue;
    }

    const group = _ensureGroup(root, typeObj.schema);
    const label = singularLabelFor(typeObj.schema);

    group.children.push({
      label,
      count,
      namespaced,
      name:   typeObj.id,
      weight: typeWeightFor(label),
      route:  {
        name:   'c-cluster-resource',
        params: {
          cluster:  clusterId,
          resource: typeObj.id,
        }
      },
    });
  }

  // Add virtual types
  for ( const item of virtualTypes() ) {
    const group = _ensureGroup(root, item.group);

    group.children.push(item);
  }

  // Sort all the insides of the groups
  for ( const group of Object.keys(root) ) {
    if ( root[group] && root[group].children ) {
      root[group].children = sortBy(root[group].children, ['namespaced', 'weight:desc', 'label']);
    }
  }

  // Sort the groups themselves
  return sortBy(Object.values(root), ['weight:desc', 'label']);
}
function _ensureGroup(tree, schemaOrLabel, route) {
  const label = route ? schemaOrLabel : groupLabelFor(schemaOrLabel);

  let group = tree[label];

  if ( !tree[label] ) {
    group = {
      label,
      weight:   groupWeightFor(label),
      children: [],
    };

    if ( route ) {
      group.route = route;
    }

    tree[label] = group;
  }

  return group;
}

function allNegativeFilters(namespaces) {
  return namespaces.filter(x => x.startsWith('!')).length === namespaces.length;
}

function matchingCounts(typeObj, namespaces) {
  // That was easy
  if ( !typeObj.namespaced || !typeObj.byNamespace ) {
    return typeObj.count || 0;
  }

  const allNegative = allNegativeFilters(namespaces);
  let out = 0;

  // If all the filters are negative, start with the full count and subtract
  if ( allNegative ) {
    out = typeObj.count;

    for ( let i = 0 ; i < namespaces.length ; i++ ) {
      out -= typeObj.byNamespace[namespaces[i].substr(1)] || 0;
    }

    return out;
  }

  // Otherwise start with 0 and count up
  for ( let i = 0 ; i < namespaces.length ; i++ ) {
    out += typeObj.byNamespace[namespaces[i]] || 0;
  }

  return out;
}
