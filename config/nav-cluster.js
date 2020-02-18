import { escapeRegex } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import { SCHEMA, COUNT } from '@/config/types';
import { isArray } from '@/utils/array';

const basicTypes = {};
const groupWeights = {};
const groupMappings = [];
const groupLabelCache = {};
const typeWeights = {};
const typeMappings = [];
const typeLabelCache = {};

export function addBasicType(types) {
  if ( !isArray(types) ) {
    types = [types];
  }

  for ( const t of types ) {
    basicTypes[t] = true;
  }
}

// setGroupWeight('Core' 99); -- higher groups are shown first
export function setGroupWeight(groups, weight) {
  if ( !isArray(groups) ) {
    groups = [groups];
  }

  for ( const g of groups ) {
    groupWeights[g] = weight;
  }
}

// setTypeWeight('Cluster' 99); -- higher groups are shown first
export function setTypeWeight(entries, weight) {
  if ( !isArray(entries) ) {
    entries = [entries];
  }

  for ( const e of entries ) {
    typeWeights[e] = weight;
  }
}

// addGroupMapping('ugly.thing', 'Nice Thing', 1);
// addGroupMapping(/ugly.thing.(stuff)', '$1', 2);
// addGroupMapping(/ugly.thing.(stuff)', function(groupStr, ruleObj, regexMatch, typeObj) { return ucFirst(group.id) } , 2);
export function addGroupMapping(match, replace, priority = 5, continueOnMatch = false) {
  _addMapping(groupMappings, match, replace, priority, continueOnMatch);
}

export function addTypeMapping(match, replace, priority = 5, continueOnMatch = false) {
  _addMapping(typeMappings, match, replace, priority, continueOnMatch);
}

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

    if ( !attrs.kind ) {
      // Skip the apiGroups resource
      continue;
    }

    out.push({
      schema,
      id:          schema.id,
      label:       singularLabelFor(schema),
      group:       attrs.group,
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
    } else if ( mode === 'basic' && !basicTypes[typeObj.id]) {
      // If the mode is basic, ignore this entry unless it's a basic type
      continue;
    }

    const groupName = groupLabelForObjn(typeObj);
    const group = _ensureGroup(root, groupName);

    group.children.push({
      count,
      namespaced,
      name:   typeObj.id,
      weight: typeWeights[typeObj.id] || 0,
      label:  typeLabelForObj(typeObj),
      route:  {
        name:   'c-cluster-resource',
        params: {
          cluster:  clusterId,
          resource: typeObj.id,
        }
      },
    });
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

export function singularLabelFor(schema) {
  const attrs = schema.attributes || {};

  return attrs.kind;
}

export function pluralLabelFor($store, typeStr) {
  const singular = singularLabelFor($store, typeStr);

  // @TODO add mapper to customize pluralizing things here...

  if ( singular.endsWith('s') ) {
    return `${ singular }es`;
  }

  return `${ singular }s`;
}

// --------------------------------------------

function _addMapping(mappings, match, replace, priority, continueOnMatch) {
  if ( typeof match === 'string' ) {
    match = new RegExp(escapeRegex(match), 'i');
  }

  mappings.push({
    match,
    replace,
    priority,
    continueOnMatch,
    insertIndex: mappings.length,
  });

  // Re-sort the list by priority (highest first) and insert time (oldest first)
  mappings.sort((a, b) => {
    const pri = b.priority - a.priority;

    if ( pri ) {
      return pri;
    }

    return a.insertIndex - b.insertIndex;
  });
}

function _ensureGroup(tree, label, route) {
  let group = tree[label];

  if ( !tree[label] ) {
    group = {
      label,
      weight:   groupWeights[label] || 0,
      children: [],
    };

    if ( route ) {
      group.route = route;
    }

    tree[label] = group;
  }

  return group;
}

// Turns a type name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
function typeLabelForObj(typeObj) {
  return _applyMapping(typeObj, typeMappings, 'id', typeLabelCache);
}

// Turns a group name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
function groupLabelForObjn(typeObj) {
  return _applyMapping(typeObj, groupMappings, 'group', groupLabelCache);
}

function _applyMapping(obj, mappings, keyField, cache) {
  const key = obj[keyField];

  if ( typeof key !== 'string' ) {
    return null;
  }

  if ( cache[key] ) {
    return cache[key];
  }

  let out = `${ key }`;

  for ( const rule of mappings ) {
    const res = out.match(rule.match);

    if ( res ) {
      if ( typeof rule.replace === 'function' ) {
        out = rule.replace(out, rule, res, obj);
      } else {
        out = out.replace(rule.match, rule.replace);
      }

      if ( !rule.continueOnMatch ) {
        break;
      }
    }
  }

  cache[key] = out;

  return out;
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
