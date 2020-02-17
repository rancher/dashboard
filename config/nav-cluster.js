import { escapeRegex } from '@/utils/string';
import { sortBy } from '@/utils/sort';
import { SCHEMA, COUNT } from '@/config/types';
import { isArray } from '@/utils/array';

const basicTypes = {};
const groupWeights = {};
const groupMappings = [];
const groupLabelCache = {};
const entryWeights = {};
const entryMappings = [];
const entryLabelCache = {};

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

// setEntryWeight('Cluster' 99); -- higher groups are shown first
export function setEntryWeight(entries, weight) {
  if ( !isArray(entries) ) {
    entries = [entries];
  }

  for ( const e of entries ) {
    entryWeights[e] = weight;
  }
}

// addGroupMapping('ugly.thing', 'Nice Thing', 1);
// addGroupMapping(/ugly.thing.(stuff)', '$1', 2);
// addGroupMapping(/ugly.thing.(stuff)', function(group) { return ucFirst(group.id) } , 2);
export function addGroupMapping(match, replace, priority = 5, continueOnMatch = false) {
  _addMapping(groupMappings, match, replace, priority, continueOnMatch);
}

export function addEntryMapping(match, replace, priority = 5, continueOnMatch = false) {
  _addMapping(entryMappings, match, replace, priority, continueOnMatch);
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
      label:       attrs.kind,
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

    if ( count === 0 && mode !== 'all') {
      // If there's none of this resource, ignore this entry unless viewing ALL types
      continue;
    } else if ( mode === 'basic' && !basicTypes[typeObj.id] && currentType !== typeObj.id ) {
      // If the mode is basic, ignore this entry unless it's a basic type, or the current type
      continue;
    }

    const groupName = groupLabelFor(typeObj);
    const group = _ensureGroup(root, groupName);

    group.children.push({
      count,
      namespaced,
      name:   typeObj.id,
      weight: entryWeights[typeObj.id] || 0,
      label:  typeLabelFor(typeObj),
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
      root[group].children = sortBy(root[group].children, 'label');
    }
  }

  // Sort the groups themselves
  return sortBy(Object.values(root), ['priority:desc', 'namespaced', 'label']);
}

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
function typeLabelFor(typeObj) {
  return _applyMapping(typeObj, entryMappings, 'id', entryLabelCache);
}

// Turns a group name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
function groupLabelFor(typeObj) {
  return _applyMapping(typeObj, groupMappings, 'group', groupLabelCache);
}

function _applyMapping(obj, mappings, keyField, cache) {
  const key = obj[keyField];

  if ( !key ) {
    return null;
  }

  if ( cache[key] ) {
    return cache[key];
  }

  let out = key;

  for ( const entry of mappings ) {
    const res = out.match(entry.match);

    if ( res ) {
      if ( typeof entry.replace === 'function' ) {
        out = entry.replace(out, entry, res);
      } else {
        out = res.replace(entry.match, entry.replace);
      }

      if ( !entry.continueOnMatch ) {
        break;
      }
    }
  }

  cache[key] = out;

  return out;
}

function matchingCounts(typeObj, namespaces) {
  // That was easy
  if ( !typeObj.namespaced || !typeObj.byNamespace ) {
    return typeObj.count || 0;
  }

  const allNegative = namespaces.filter(x => x.startsWith('!')).length === namespaces.length;
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
