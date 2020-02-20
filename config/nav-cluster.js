// virtualType(obj): Add an item to the tree that goes to a route instead of an actual type.  Obj can contain anything in the objects getTree returns.
// basicType(type): Mark type as one shown in basic view
// ignoreType(type): Never show type
// weightType(typeOrArrayOfTypes, weight): Set the weight (sort) order of one or more types
// mapType(matchRegexOrString, replacementStringOrFn, mapWeight, continueOnMatch): Remap a type id to a display name
// labelType(type, singular, plural): Remap the displayed name for a type
//
// ignoreGroup(group): Never show group or any types in it
// weightGroup(groupOrArrayOfGroups, weight): Set the weight (sort) order of one or more groups
// mapGroup(matchRegexOrString, replacementString, mapWeight, continueOnMatch): Remap a group name to a display name
//
// Weight on mappings determines the order in which they are applied (highest first)
// Weight of types and groups determines the order in which they are displayed (highest first/higher up on nav)

import { escapeRegex } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import { SCHEMA, COUNT } from '@/config/types';
import { isArray } from '@/utils/array';

export function virtualType(obj) {
  _virtualTypes.push(obj);
}

export function basicType(types) {
  if ( !isArray(types) ) {
    types = [types];
  }

  for ( const t of types ) {
    _basicTypes[t] = true;
  }
}

export function ignoreGroup(group) {
  _groupIgnore[group] = true;
}

export function ignoreType(type) {
  _typeIgnore[type] = true;
}

export function labelType(type, singular, plural) {
  _singularLabels[type] = singular;
  _pluralLabels[type] = plural;
}

// setGroupWeight('Core' 99); -- higher groups are shown first
export function weightGroup(groups, weight) {
  if ( !isArray(groups) ) {
    groups = [groups];
  }

  for ( const g of groups ) {
    _groupWeights[g] = weight;
  }
}

// setTypeWeight('Cluster' 99); -- higher groups are shown first
export function weightType(entries, weight) {
  if ( !isArray(entries) ) {
    entries = [entries];
  }

  for ( const e of entries ) {
    _typeWeights[e] = weight;
  }
}

// addGroupMapping('ugly.thing', 'Nice Thing', 1);
// addGroupMapping(/ugly.thing.(stuff)', '$1', 2);
// addGroupMapping(/ugly.thing.(stuff)', function(groupStr, ruleObj, regexMatch, typeObj) { return ucFirst(group.id) } , 2);
export function mapGroup(match, replace, weight = 5, continueOnMatch = false) {
  _addMapping(_groupMappings, match, replace, weight, continueOnMatch);
}

export function mapType(match, replace, weight = 5, continueOnMatch = false) {
  _addMapping(_typeMappings, match, replace, weight, continueOnMatch);
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
    const group = attrs.group;

    if ( !attrs.kind ) {
      // Skip the apiGroups resource
      continue;
    }

    if ( _groupIgnore[group] || _typeIgnore[schema.id] ) {
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
    } else if ( mode === 'basic' && !_basicTypes[typeObj.id]) {
      // If the mode is basic, ignore this entry unless it's a basic type
      continue;
    }

    const groupName = groupLabelForObj(typeObj);
    const group = _ensureGroup(root, groupName);

    group.children.push({
      count,
      namespaced,
      name:   typeObj.id,
      weight: _typeWeights[typeObj.id] || 0,
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

  // Add virtual types
  for ( const item of _virtualTypes ) {
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

export function singularLabelFor(schema) {
  if ( _singularLabels[schema.id] ) {
    return _singularLabels[schema.id];
  }

  const attrs = schema.attributes || {};

  return attrs.kind;
}

export function pluralLabelFor(schema) {
  if ( _pluralLabels[schema.id] ) {
    return _pluralLabels[schema.id];
  }

  const singular = singularLabelFor(schema);

  if ( singular.endsWith('s') ) {
    return `${ singular }es`;
  }

  return `${ singular }s`;
}

// --------------------------------------------

const _virtualTypes = [];
const _basicTypes = {};
const _groupIgnore = {};
const _groupWeights = {};
const _groupMappings = [];
const _groupLabelCache = {};
const _typeIgnore = {};
const _typeWeights = {};
const _typeMappings = [];
const _typeLabelCache = {};
const _singularLabels = {};
const _pluralLabels = {};

function _addMapping(mappings, match, replace, weight, continueOnMatch) {
  if ( typeof match === 'string' ) {
    match = new RegExp(escapeRegex(match), 'i');
  }

  mappings.push({
    match,
    replace,
    weight,
    continueOnMatch,
    insertIndex: mappings.length,
  });

  // Re-sort the list by weight (highest first) and insert time (oldest first)
  mappings.sort((a, b) => {
    const pri = b.weight - a.weight;

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
      weight:   _groupWeights[label] || 0,
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
  return _applyMapping(typeObj, _typeMappings, 'id', _typeLabelCache);
}

// Turns a group name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
function groupLabelForObj(typeObj) {
  return _applyMapping(typeObj, _groupMappings, 'group', _groupLabelCache);
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
