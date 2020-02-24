// This file has 2 sections that control getting and using specializatinos of particular types
// over the generic info that is specified or generated from schemas.
//
// 1) Getting info about types
// singularLabelFor(schema): Get the singular form of this schema's type
// pluralLabelFor(schema): Get the plural form of this schema's type
//
// 2) Changing specialization info about a type
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
import { isArray } from '@/utils/array';
import { get } from '@/utils/object';

import { STATE, NAMESPACE_NAME, NAME } from '@/config/table-headers';
import { WORKLOAD } from '@/config/types';

// ----------------------------------------------------------------------------
// 1 ) Getting info
// ----------------------------------------------------------------------------
// Turns a type name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
export function singularLabelFor(schema) {
  return _applyMapping(schema, _typeMappings, 'id', _typeLabelCache);
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

// Turns a group name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
export function groupLabelFor(schema) {
  return _applyMapping(schema, _groupMappings, 'attributes.group', _groupLabelCache);
}

export function isIgnored(schema) {
  return _groupIgnore[schema.attributes.group] || _typeIgnore[schema.id] || false;
}

export function isBasic(schema) {
  return _basicTypes[schema.id] || false;
}

export function typeWeightFor(type) {
  return _typeWeights[type.toLowerCase()] || 0;
}

export function groupWeightFor(group) {
  return _groupWeights[group.toLowerCase()] || 0;
}

export function virtualTypes() {
  return _virtualTypes.slice();
}

export function headersFor(schema) {
  if ( _headers[schema.id] ) {
    return _headers[schema.id];
  }

  const out = [STATE]; // Everybody gets a state

  const attributes = schema.attributes || {};
  const columns = attributes.columns;
  const namespaced = attributes.namespaced;

  let hasName = false;

  for ( const col of columns ) {
    if ( col.format === 'name' ) {
      hasName = true;
      out.push(namespaced ? NAMESPACE_NAME : NAME);
    } else {
      let formatter, width;

      if ( col.format === 'date' || col.type === 'date' ) {
        formatter = 'Date';
        width = 120;
      }

      out.push({
        name:  col.name.toLowerCase(),
        label: col.name,
        value: col.field.startsWith('.') ? `$${ col.field }` : col.field,
        sort:  [col.field],
        formatter,
        width,
      });
    }
  }

  if ( !hasName ) {
    out.unshift(namespaced ? NAMESPACE_NAME : NAME);
  }

  return out;
}

// ----------------------------------------------------------------------------
// 2) Changing info
// ----------------------------------------------------------------------------
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
const _pluralLabels = {};
const _headers = {};
const _hasCustom = {
  list:    {},
  detail:  {},
  edit:    {},
};

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

export function headers(type, headers) {
  _headers[type] = headers;
}

// setGroupWeight('core' 99); -- higher groups are shown first
// These operate on *displayed* group names, after mapping
export function weightGroup(groupOrGroups, weight) {
  if ( !isArray(groupOrGroups) ) {
    groupOrGroups = [groupOrGroups];
  }

  for ( const g of groupOrGroups ) {
    _groupWeights[g.toLowerCase()] = weight;
  }
}

// setTypeWeight('Cluster' 99); -- higher groups are shown first
// These operate on *displayed* type names, after mapping
export function weightType(typeOrTypes, weight) {
  if ( !isArray(typeOrTypes) ) {
    typeOrTypes = [typeOrTypes];
  }

  for ( const e of typeOrTypes ) {
    _typeWeights[e.toLowerCase()] = weight;
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

export function pluralizeType(type, plural) {
  _pluralLabels[type] = plural;
}

function _applyMapping(obj, mappings, keyField, cache) {
  const key = get(obj, keyField);

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

// --------------------------------------------

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

// ------------------------------------
// Custom list/detail/edit/header component detection
//
// Note: you can't refactor these into one function that does `@/${kind}/${type}`,
// because babel needs some hardcoded idea where to look for the dependency.
// ------------------------------------

export function hasCustomList(type) {
  const cache = _hasCustom.list;

  if ( cache[type] !== undefined ) {
    return cache[type];
  }

  try {
    require.resolve(`@/list/${ type }`);
    cache[type] = true;

    return true;
  } catch (e) {
    cache[type] = false;

    return false;
  }
}

export function hasCustomDetail(type) {
  const cache = _hasCustom.detail;

  if ( cache[type] !== undefined ) {
    return cache[type];
  }

  try {
    require.resolve(`@/detail/${ type }`);
    cache[type] = true;

    return true;
  } catch (e) {
    cache[type] = false;

    return false;
  }
}

export function hasCustomEdit(type) {
  if (Object.values(WORKLOAD).includes(type)) {
    type = 'workload';
  }

  const cache = _hasCustom.edit;

  if ( cache[type] !== undefined ) {
    return cache[type];
  }

  try {
    require.resolve(`@/edit/${ type }`);
    cache[type] = true;

    return true;
  } catch (e) {
    cache[type] = false;

    return false;
  }
}

export function importList(type) {
  return () => import(`@/list/${ type }`);
}

export function importDetail(type) {
  return () => import(`@/detail/${ type }`);
}

export function importEdit(type) {
  return () => import(`@/edit/${ type }`);
}
