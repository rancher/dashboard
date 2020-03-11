// This file has 2 sections that control getting and using specializations of particular types
// over the generic info that is specified or generated from schemas.
//
// 1) Getting info about types
//
// singularLabelFor(schema)   Get the singular form of this schema's type
// pluralLabelFor(schema)     Get the plural form of this schema's type
// groupLabelFor(schema)      Get the label for the API group of this schema's type
// isIgnored(schema)          Returns true if this type should be hidden from the tree
// isBasic(schema)            Returns true if this type should be included in basic view
// typeWeightFor(type)        Get the weight value for a particular type label
// groupWeightFor(group)      Get the weight value for a particular group
// virtualTypes()             Returns a list of the virtual pages to add to the treee
// headersFor(schema)         Returns the column definitions for a type to give to SortableTable
//
// 2) Detecting and usign custom list/detail/edit/header components
//
// hasCustomList(type)        Does type have a custom list implementation?
// hasCustomDetail(type)      Does type have a custom detail implementation?
// hasCustomEdit(type)        Does type have a custom edit implementation?
// importList(type)           Returns a promise that resolves to the list component for type
// importDetail(type)         Returns a promise that resolves to the detail component for type
// importEdit(type)           Returns a promise that resolves to the edit component for type
//
// 3) Changing specialization info about a type
// For all:
//   let { thingYouWant } = DSL(instanceOfThestore);
//
// virtualType(obj)           Add an item to the tree that goes to a route instead of an actual type.
//                            --  obj can contain anything in the objects getTree returns.
//                            --  obj must have a `name` that is unique among all virtual types.
//                            -- `cluster` is automatically added to route.params if it exists.
// basicType(type)            Mark type as one shown in basic view
// ignoreType(type)           Never show type
// weightType(                Set the weight (sorting) order of one or more types
//   typeOrArrayOfTypes,
//   weight                   -- Higher numbers are shown first/higher up on the nav tree
// )
// mapType(                   Remap a type id to a display name
//   matchRegexOrString,      -- Type to match, or regex that matches types
//   replacementStringOrFn,   -- String to replace the type with, or
//                            -- sync function: (type, capturedString, schemaObj => { return 'new-type'; }
//   mapWeight,               -- Priority for apply this mapping (higher numbers applied first)
//   continueOnMatch          -- If true, continue applying to hit other rules that might match the new type.
// )
// moveType(                  Change the group a type is in
//   matchRegexOrString,      -- Type to match, or regex that matches types
//   newGroup,                -- Group to move the type into
//   mapWeight,               -- Priority for apply this mapping (higher numbers applied first)
// )
// mapTypeToComponentName( Map matching types to a single component name (this is helpful if multiple types should be rendered by a single component)
// (
//   matchRegexOrString,      -- Type to match, or regex that matches types
//   replacementString        -- String to replace the type with
// )
// labelType(                 Remap the displayed label for a type
//   type,
//   singular,
//   plural
// )
//
// ignoreGroup(group):        Never show group or any types in it
// weightGroup(               Set the weight (sort) order of one or more groups
//   groupOrArrayOfGroups,    -- see weightType...
//   weight
// )
// mapGroup(                  Remap a group name to a display name
//   matchRegexOrString,      -- see mapType...
//   replacementString,
//   mapWeight,
//   continueOnMatch
// )

import { sortBy } from '@/utils/sort';
import { get, clone } from '@/utils/object';
import { isArray, findBy, addObject, removeObject } from '@/utils/array';
import { escapeRegex, ucFirst } from '@/utils/string';
import { SCHEMA, COUNT } from '@/config/types';
import { STATE, NAMESPACE_NAME, NAME, AGE } from '@/config/table-headers';

export function DSL(store, module = 'type-map') {
  return {
    basicType(types) {
      store.commit(`${ module }/basicType`, types);
    },

    ignoreType(regexOrString) {
      store.commit(`${ module }/ignoreType`, regexOrString);
    },

    ignoreGroup(regexOrString) {
      store.commit(`${ module }/ignoreGroup`, regexOrString);
    },

    headers(type, headers) {
      store.commit(`${ module }/headers`, { type, headers });
    },

    weightGroup(input, weight) {
      if ( isArray(input) ) {
        store.commit(`${ module }/weightGroup`, { groups: input, weight });
      } else {
        store.commit(`${ module }/weightGroup`, { group: input, weight });
      }
    },

    weightType(input, weight) {
      if ( isArray(input) ) {
        store.commit(`${ module }/weightType`, { types: input, weight });
      } else {
        store.commit(`${ module }/weightType`, { type: input, weight });
      }
    },

    mapGroup(match, replace, weight = 5, continueOnMatch = false) {
      store.commit(`${ module }/mapGroup`, {
        match, replace, weight, continueOnMatch
      });
    },

    mapType(match, replace, weight = 5, continueOnMatch = false) {
      store.commit(`${ module }/mapType`, {
        match, replace, weight, continueOnMatch
      });
    },

    moveType(match, group, weight = 5, continueOnMatch = false) {
      store.commit(`${ module }/moveType`, {
        match, group, weight,
      });
    },

    virtualType(obj) {
      store.commit(`${ module }/virtualType`, obj);
    },

    mapTypeToComponentName(match, replace) {
      store.commit(`${ module }/mapTypeToComponentName`, { match, replace });
    }
  };
}

export const state = function() {
  return {
    virtualTypes:            [],
    basicTypes:              {},
    groupIgnore:             [],
    groupWeights:            {},
    groupMappings:           [],
    typeIgnore:              [],
    typeWeights:             {},
    typeMappings:            [],
    typeMoveMappings:        [],
    typeToComponentMappings: [],
    pluralLabels:            {},
    headers:                 {},
    cache:                   {
      typeLabel:   {},
      typeMove:    {},
      groupLabel:  {},
      ignore:      {},
      list:        {},
      detail:      {},
      edit:        {},
    },
  };
};

export const getters = {
  // ----------------------------------------------------------------------------
  // 1 ) Getting info
  // ----------------------------------------------------------------------------
  // Turns a type name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
  singularLabelFor(state) {
    return (schema) => {
      return _applyMapping(schema, state.typeMappings, 'id', state.cache.typeLabel, () => {
        return schema.attributes.kind;
      });
    };
  },

  pluralLabelFor(state, getters) {
    return (schema) => {
      if ( state.pluralLabels[schema.id] ) {
        return state.pluralLabels[schema.id];
      }

      const singular = getters.singularLabelFor(schema);

      if ( singular.endsWith('s') ) {
        return `${ singular }es`;
      }

      return `${ singular }s`;
    };
  },

  // Turns a group name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
  groupLabelFor(state) {
    return (schemaOrName) => {
      let group = schemaOrName;

      if ( typeof group === 'object' ) {
        group = _applyMapping(group, state.typeMoveMappings, 'attributes.group', state.cache.typeMove);
      }

      return _applyMapping(group, state.groupMappings, null, state.cache.groupLabel, (group) => {
        const match = group.match(/^(.*)\.k8s\.io$/);

        if ( match ) {
          return match[1].split(/\./).map(x => ucFirst(x)).join('.');
        }

        return group;
      });
    };
  },

  isBasic(state) {
    return (schema) => {
      return state.basicTypes[schema.id] || false;
    };
  },

  typeWeightFor(state) {
    return (type) => {
      return state.typeWeights[type.toLowerCase()] || 0;
    };
  },

  groupWeightFor(state) {
    return (group) => {
      return state.groupWeights[group.toLowerCase()] || 0;
    };
  },

  getTree(state, getters, rootState, rootGetters) {
    return (mode, clusterId, namespaces, currentType) => {
      const allTypes = getters.allTypes() || {};

      const root = { children: [] };

      for ( const type in allTypes ) {
        const typeObj = allTypes[type];

        if ( getters.isIgnored(typeObj.schema) ) {
          // Skip ignored groups & types
          continue;
        }

        const namespaced = typeObj.namespaced;
        const count = _matchingCounts(typeObj, namespaces);

        const allNegative = _allNegativeFilters(namespaces);

        if ( typeObj.id === currentType ) {
          // If this is the type currently being shown, always show it
        } else if ( !namespaced && namespaces.length && !allNegative ) {
          // If a namespace filter is specified, hide non-namespaced resources.
          continue;
        } else if ( count === 0 && mode === 'used') {
          // If there's none of this type, ignore this entry when viewing only in-use types
          continue;
        } else if ( mode === 'basic' && !getters.isBasic(typeObj.schema) ) {
          // If the mode is basic, ignore this entry unless it's a basic type
          continue;
        }

        const group = _ensureGroup(root, typeObj.schema);
        const label = getters.singularLabelFor(typeObj.schema);

        group.children.push({
          label,
          count,
          namespaced,
          name:   typeObj.id,
          weight: getters.typeWeightFor(label),
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
      const virt = getters.virtualTypes();

      for ( const vt of virt ) {
        const item = clone(vt);

        if ( item.route && typeof item.route === 'object' ) {
          item.route.params = item.route.params || {};
          item.route.params.cluster = clusterId;
        }

        const group = _ensureGroup(root, item.group, item.route);

        group.children.push(item);
      }

      // Recursively sort the groups
      _sortGroup(root);

      return root.children;

      // ----------------------

      function _ensureGroup(tree, schemaOrLabel, route) {
        let label = getters.groupLabelFor(schemaOrLabel);

        if ( label && label.includes('::') ) {
          let parent;

          [parent, label] = label.split('::', 2);
          tree = _ensureGroup(tree, parent);
        }

        let group = findBy(tree.children, 'label', label);

        if ( !group ) {
          group = {
            name:   label,
            label,
            weight:   getters.groupWeightFor(label),
          };

          if ( route ) {
            group.route = route;
          }

          tree.children.push(group);
        }

        if ( !group.children ) {
          group.children = [];
        }

        return group;
      }
    };
  },

  allTypes(state, getters, rootState, rootGetters) {
    return () => {
      const schemas = rootGetters['cluster/all'](SCHEMA);
      const counts = rootGetters['cluster/all'](COUNT)[0].counts;
      const out = {};

      for ( const schema of schemas ) {
        const attrs = schema.attributes || {};
        const count = counts[schema.id];
        const groupName = attrs.group || 'core';

        if ( !attrs.kind ) {
          // Skip the "apiGroups" resource which has no kind
          continue;
        }

        out[schema.id] = {
          schema,
          group:       groupName,
          id:          schema.id,
          label:       getters.singularLabelFor(schema),
          namespaced:  attrs.namespaced,
          count:       count ? count.count : null,
          byNamespace: count ? count.namespaces : {},
          revision:    count ? count.revision : null,
        };
      }

      return out;
    };
  },

  virtualTypes(state, getters, rootState, rootGetters) {
    return () => {
      const isRancher = rootGetters.isRancher;
      const allTypes = getters.allTypes() || {};

      const out = state.virtualTypes.filter((typeObj) => {
        if ( typeObj.ifIsRancher && !isRancher ) {
          return false;
        }

        return !typeObj.ifHaveType || !!allTypes[typeObj.ifHaveType];
      });

      return out;
    };
  },

  headersFor(state) {
    return (schema) => {
      // A specific list has been provided
      if ( state.headers[schema.id] ) {
        return state.headers[schema.id];
      }

      // Make one up from schema
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

          if ( col.format === '' && col.name === 'Age' ) {
            out.push(AGE);
            continue;
          }

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

      // Age always goes last
      if ( out.includes(AGE) ) {
        removeObject(out, AGE);
        out.push(AGE);
      }

      return out;
    };
  },

  // ------------------------------------
  // Custom list/detail/edit/header component detection
  //
  // Note: you can't refactor these into one function that does `@/${kind}/${type}`,
  // because babel needs some hardcoded idea where to look for the dependency.
  //
  // Note 2: Yes these are editing state in a gettter for caching... it's ok, probably.
  // ------------------------------------
  hasCustomList(state, getters) {
    return (rawType) => {
      const type = getters.componentFor(rawType);
      const cache = state.cache.list;

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
    };
  },

  hasCustomDetail(state, getters) {
    return (rawType) => {
      const type = getters.componentFor(rawType);
      const cache = state.cache.detail;

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
    };
  },

  hasCustomEdit(state, getters) {
    return (rawType) => {
      const type = getters.componentFor(rawType);
      const cache = state.cache.edit;

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
    };
  },

  importList(state, getters) {
    return (rawType) => {
      const type = getters.componentFor(rawType);

      return () => import(`@/list/${ type }`);
    };
  },

  importDetail(state, getters) {
    return (rawType) => {
      const type = getters.componentFor(rawType);

      return () => import(`@/detail/${ type }`);
    };
  },

  importEdit(state, getters) {
    return (rawType) => {
      const type = getters.componentFor(rawType);

      return () => import(`@/edit/${ type }`);
    };
  },

  componentFor(state) {
    return (type) => {
      const mapping = state.typeToComponentMappings.find((mapping) => {
        const re = stringToRegex(mapping.match);

        return re.test(type);
      });

      return mapping ? mapping.replace : type;
    };
  },

  isIgnored(state) {
    return (schema) => {
      if ( typeof state.cache.ignore[schema.id] === 'undefined' ) {
        let ignore = false;

        for ( const rule of state.groupIgnore ) {
          const group = schema?.attributes?.group;

          if ( group && group.match(stringToRegex(rule)) ) {
            ignore = true;
            break;
          }
        }

        if ( !ignore ) {
          for ( const rule of state.typeIgnore ) {
            if ( schema.id.match(stringToRegex(rule)) ) {
              ignore = true;
              break;
            }
          }
        }

        state.cache.ignore[schema.id] = ignore;
      }

      return state.cache.ignore[schema.id];
    };
  },
};

export const mutations = {
  virtualType(state, obj) {
    if ( !findBy(state.virtualTypes, 'name', obj.name) ) {
      addObject(state.virtualTypes, obj);
    }
  },

  basicType(state, types) {
    if ( !isArray(types) ) {
      types = [types];
    }

    for ( const t of types ) {
      state.basicTypes[t] = true;
    }
  },

  ignoreGroup(state, match) {
    match = ensureRegex(match);
    // State shouldn't contain actual RegExp objects, because they don't serialize
    state.groupIgnore.push(regexToString(match));
  },

  ignoreType(state, match) {
    match = ensureRegex(match);
    state.typeIgnore.push(regexToString(match));
  },

  headers(state, { type, headers }) {
    state.headers[type] = headers;
  },

  // weightGroup('core' 99); -- higher groups are shown first
  // These operate on *displayed* group names, after mapping
  weightGroup(state, { group, groups, weight }) {
    if ( !groups ) {
      groups = [];
    }

    if ( group ) {
      groups.push(group);
    }

    for ( const g of groups ) {
      state.groupWeights[g.toLowerCase()] = weight;
    }
  },

  // weightType('Cluster' 99); -- higher groups are shown first
  // These operate on *displayed* type names, after mapping
  weightType(state, { type, types, weight }) {
    if ( !types ) {
      types = [];
    }

    if ( type ) {
      types.push(type);
    }

    for ( const t of types ) {
      state.typeWeights[t.toLowerCase()] = weight;
    }
  },

  // mapGroup('ugly.thing', 'Nice Thing', 1);
  // mapGroup(/ugly.thing.(stuff)', '$1', 2);
  // mapGroup(/ugly.thing.(stuff)', function(groupStr, ruleObj, regexMatch, typeObj) { return ucFirst(group.id) } , 2);
  mapGroup(state, {
    match, replace, weight = 5, continueOnMatch = false
  }) {
    _addMapping(state.groupMappings, match, replace, weight, continueOnMatch);
  },

  mapType(state, {
    match, replace, weight = 5, continueOnMatch = false
  }) {
    _addMapping(state.typeMappings, match, replace, weight, continueOnMatch);
  },

  // moveType('apps.v1.deployment', 'Core');
  moveType(state, { match, group, weight = 5 }) {
    _addMapping(state.typeMoveMappings, match, group, weight);
  },

  mapTypeToComponentName(state, { match, replace }) {
    state.typeToComponentMappings.push({ match, replace });
  },

  pluralizeType(type, plural) {
    state.pluralLabels[type] = plural;
  }
};

function _sortGroup(tree) {
  tree.children = sortBy(tree.children, ['namespaced', 'weight:desc', 'label']);
  for (const entry of tree.children ) {
    if ( entry.children ) {
      _sortGroup(entry);
    }
  }
}

function _allNegativeFilters(namespaces) {
  return namespaces.filter(x => x.startsWith('!')).length === namespaces.length;
}

function _matchingCounts(typeObj, namespaces) {
  if (!typeObj.count && typeObj.count !== 0) {
    return '';
  }
  // That was easy
  if ( !typeObj.namespaced || !typeObj.byNamespace ) {
    return typeObj.count || '';
  }

  const allNegative = !!_allNegativeFilters(namespaces);
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

function _applyMapping(objOrValue, mappings, keyField, cache, defaultFn) {
  let key = objOrValue;
  let found = false;

  if ( keyField ) {
    if ( typeof objOrValue !== 'object' ) {
      return objOrValue;
    }

    key = get(objOrValue, keyField);

    if ( typeof key !== 'string' ) {
      return null;
    }
  }

  if ( key && cache[key] ) {
    return cache[key];
  }

  let out = `${ key }`;

  for ( const rule of mappings ) {
    const re = stringToRegex(rule.match);
    const captured = out.match(re);

    if ( captured && rule.replace ) {
      out = out.replace(re, rule.replace);

      found = true;
      if ( !rule.continueOnMatch ) {
        break;
      }
    }
  }

  if ( !found && defaultFn ) {
    out = defaultFn(out, objOrValue);
  }

  cache[key] = out;

  return out;
}

function _addMapping(mappings, match, replace, weight, continueOnMatch) {
  match = regexToString(ensureRegex(match));

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

const regexCache = {};

function ensureRegex(strOrRegex) {
  if ( typeof strOrRegex === 'string' ) {
    return new RegExp(`^${ escapeRegex(strOrRegex) }$`, 'i');
  }

  return strOrRegex;
}

function regexToString(regex) {
  return regex.source;
}

function stringToRegex(str) {
  let out = regexCache[str];

  if ( !out ) {
    out = new RegExp(str);
    regexCache[str] = out;
  }

  return out;
}
