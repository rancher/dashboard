// This file has 2 sections that control getting and using specializations of particular types
// over the generic info that is specified or generated from schemas.
//
// 1) Getting info about types
//
// labelFor(schema, count)    Get the display label for a schema.  Count is (in English) 1 or not-1 for pluralizing
// groupLabelFor(schema)      Get the label for the API group of this schema's type
// isIgnored(schema)          Returns true if this type should be hidden from the tree
// groupForBasicType(schema)  Returns the group a type should be shown in basic view, or false-y if it shouldn't be shown.
// typeWeightFor(type, forBasic)   Get the weight value for a particular type label
// groupWeightFor(group, forBasic) Get the weight value for a particular group
// headersFor(schema)         Returns the column definitions for a type to give to SortableTable
// activeProducts()           Returns the list of products that are installed and should be shown
//
// 2) Detecting and using custom list/detail/edit/header components
//
// hasCustomList(type)              Does type have a custom list implementation?
// hasCustomDetail(type[,subType])  Does type have a custom detail implementation?
// hasCustomEdit(type[,subType])    Does type have a custom edit implementation?
// importList(type)                 Returns a promise that resolves to the list component for type
// importDetail(type[,subType])     Returns a promise that resolves to the detail component for type
// importEdit(type[,subType])       Returns a promise that resolves to the edit component for type
// optionsFor(schemaOrType)         Return the configured options for a type (from configureType)
//
// 3) Changing specialization info about a type
// For all:
//   let { thingYouWant } = DSL(instanceOfTheStore, 'product');
//
// product(                   Add a product into the nav
//   removable,               -- Is the product removable (true) or built-in (false).
//   weight,                  -- Sort order and divider sections in the product menu.  3=global (fleet, ecm), 2=always on (apps, explorer) 1=other
//   showClusterSwitcher,     -- Show the cluster switcher in the header (default true)
//   showNamespaceFilter,     -- Show the namespace filter in the header (default false)
//   showWorkspaceSwitcher,   -- Show the workspace switcher in the header (conflicts with namespace) (default false)
//   ifHaveGroup,             -- Show this product only if the given group exists in the store [inStore]
//   ifHaveType,              -- Show this product only if the given type exists in the store [inStore]
//   inStore,                 -- Which store to look at for if* above and the left-nav, defaults to "cluster"
//   public,                  -- If true, show to all users.  If false, only show when the Developer Tools pref is on (default true)
// })
//
// externalLink(stringOrFn)  The product has an external page (function gets context object
//
// virtualType(obj)           Add an item to the tree that goes to a route instead of an actual type.
//                            --  obj can contain anything in the objects getTree returns.
//                            --  obj must have a `name` that is unique among all virtual types.
//                            -- `cluster` is automatically added to route.params if it exists.
//
// spoofedType(obj)           Create a fake type that can be treated like a normal type
//
// basicType(                 Mark type(s) as always shown in the top of the nav
//   type(s),                 -- Type name or arrry of type names
//   group                    -- Group to show the type(s) under; false-y for top-level.
// )
// basicType(                 Mark all types in group as always shown in the top of the nav
//   group,                   -- Group to show
//   asLabel                  -- Label to display the group as; false-y for top-level.
// )
// ignoreType(type)           Never show type
// weightType(                Set the weight (sorting) order of one or more types
//   typeOrArrayOfTypes,
//   weight,                  -- Higher numbers are shown first/higher up on the nav tree
//   forBasic                 -- Apply to basic type instead of regular type tree
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
// componentForType(          Map matching types to a single component name
// (                          (this is helpful if multiple types should be rendered by a single component)
//   matchRegexOrString,      -- Type to match, or regex that matches types
//   replacementString        -- String to replace the type with
// )
// configureType(            Display options for a particular type
//   type,                    -- Type to apply to
//  options                   -- Object of options.  Defaults/Supported: {
//                               isCreatable: true, -- If false, disable create even if schema says it's allowed
//                               isEditable: true,  -- Ditto, for edit
//                               isRemovable: true,  -- Ditto, for remove/delete
//                               showState: true,  -- If false, hide state in columns and masthead
//                               showAge: true,    -- If false, hide age in columns and masthead
//                               canYaml: true,
//                           }
// )
// ignoreGroup(group):        Never show group or any types in it
// weightGroup(               Set the weight (sorting) of one or more groups
//   groupOrArrayOfGroups,    -- see weightType...
//   weight
// )
// mapGroup(                  Remap a group name to a display name
//   matchRegexOrString,      -- see mapType...
//   replacementString,
//   mapWeight,
//   continueOnMatch
// )

import { AGE, NAME, NAMESPACE, STATE } from '@/config/table-headers';
import { COUNT, SCHEMA } from '@/config/types';
import { DEV, EXPANDED_GROUPS, FAVORITE_TYPES } from '@/store/prefs';
import {
  addObject, findBy, insertAt, isArray, removeObject
} from '@/utils/array';
import { clone, get } from '@/utils/object';
import {
  ensureRegex, escapeHtml, escapeRegex, ucFirst, pluralize
} from '@/utils/string';
import { importList, importDetail, importEdit, loadProduct } from '@/utils/dynamic-importer';

import { NAME as EXPLORER } from '@/config/product/explorer';
import isObject from 'lodash/isObject';
import { normalizeType } from '@/plugins/steve/normalize';
import { sortBy } from '@/utils/sort';

export const NAMESPACED = 'namespaced';
export const CLUSTER_LEVEL = 'cluster';
export const BOTH = 'both';

export const ALL = 'all';
export const BASIC = 'basic';
export const FAVORITE = 'favorite';
export const USED = 'used';

export const ROOT = 'root';

export const SPOOFED_PREFIX = '__[[spoofed]]__';
export const SPOOFED_API_PREFIX = '__[[spoofedapi]]__';

const instanceMethods = {};

export function DSL(store, product, module = 'type-map') {
  // store.commit(`${ module }/product`, { name: product });

  return {
    product(inOpt) {
      const opt = {
        name:                product,
        weight:              1,
        inStore:             'cluster',
        removable:           true,
        showClusterSwitcher: true,
        showNamespaceFilter: false,
        public:              true,
        filterMode:          'namespaces',
        ...inOpt
      };

      for ( const k of ['ifHaveGroup', 'ifHaveType'] ) {
        if ( opt[k] ) {
          opt[k] = regexToString(ensureRegex(opt[k]));
        }
      }

      store.commit(`${ module }/product`, opt);
    },

    basicType(types, group) {
      // Support passing in a map of types and using just the values
      if ( !isArray(types) && types && isObject(types) ) {
        types = Object.values(types);
      }

      store.commit(`${ module }/basicType`, {
        product, types, group
      });
    },

    // Type- and Group-dependent
    groupBy(type, field) {
      store.commit(`${ module }/groupBy`, { type, field });
    },

    headers(type, headers) {
      store.commit(`${ module }/headers`, { type, headers });
    },

    hideBulkActions(type, field) {
      store.commit(`${ module }/hideBulkActions`, { type, field });
    },

    configureType(match, options) {
      store.commit(`${ module }/configureType`, { ...options, match });
    },

    componentForType(match, replace) {
      store.commit(`${ module }/componentForType`, { match, replace });
    },

    ignoreType(regexOrString) {
      store.commit(`${ module }/ignoreType`, regexOrString);
    },

    ignoreGroup(regexOrString) {
      store.commit(`${ module }/ignoreGroup`, regexOrString);
    },

    weightGroup(input, weight, forBasic) {
      if ( isArray(input) ) {
        store.commit(`${ module }/weightGroup`, {
          groups: input, weight, forBasic
        });
      } else {
        store.commit(`${ module }/weightGroup`, {
          group: input, weight, forBasic
        });
      }
    },

    weightType(input, weight, forBasic) {
      if ( isArray(input) ) {
        store.commit(`${ module }/weightType`, {
          types: input, weight, forBasic
        });
      } else {
        store.commit(`${ module }/weightType`, {
          type: input, weight, forBasic
        });
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
      store.commit(`${ module }/virtualType`, { product, obj });
    },

    spoofedType(obj) {
      store.commit(`${ module }/spoofedType`, { product, obj });
    }
  };
}

let called = false;

export async function applyProducts(store) {
  if (called) {
    return;
  }

  called = true;
  const ctx = require.context('@/config/product', true, /.*/);

  const products = ctx.keys().filter(path => !path.endsWith('.js')).map(path => path.substr(2));

  for ( const product of products ) {
    const impl = await loadProduct(product);

    if ( impl?.init ) {
      impl.init(store);
    }
  }
}

export const state = function() {
  return {
    products:                [],
    virtualTypes:            {},
    spoofedTypes:            {},
    basicTypes:              {},
    groupIgnore:             [],
    groupWeights:            {},
    basicGroupWeights:       { [ROOT]: 1000 },
    groupMappings:           [],
    typeIgnore:              [],
    basicTypeWeights:        {},
    typeWeights:             {},
    typeMappings:            [],
    typeMoveMappings:        [],
    typeToComponentMappings: [],
    typeOptions:             [],
    groupBy:                 {},
    headers:                 {},
    hideBulkActions:         {},
    schemaGeneration:        1,
    cache:                   {
      typeMove:     {},
      groupLabel:   {},
      ignore:       {},
      list:         {},
      detail:       {},
      edit:         {},
      componentFor: {},
    },
  };
};

export const getters = {
  // ----------------------------------------------------------------------------
  // 1 ) Getting info
  // ----------------------------------------------------------------------------
  // Turns a type name into a display label (e.g. management.cattle.io.cluster -> Cluster)
  labelFor(state, getters, rootState, rootGetters) {
    return (schema, count = 1) => {
      return _applyMapping(schema, state.typeMappings, 'id', false, () => {
        const key = `typeLabel."${ schema.id }"`;

        if ( rootGetters['i18n/exists'](key) ) {
          return rootGetters['i18n/t'](key, { count }).trim();
        }

        const out = schema?.attributes?.kind || schema.id || '?';

        // Add spaces, but breaks typing names into jump menu naturally
        // out = ucFirst(out.replace(/([a-z])([A-Z])/g,'$1 $2'));

        if ( count === 1 ) {
          return out;
        }

        // This works for most things... if you don't like it, put in a typeLabel translation for above.
        return pluralize(out);
      });
    };
  },

  // Turns a group name into a display label (e.g. management.cattle.io.v3.cluster -> Cluster)
  groupLabelFor(state) {
    return (schemaOrName) => {
      let group = schemaOrName;

      if ( typeof schemaOrName === 'object' ) {
        let moved = false;

        for ( const rule of state.typeMoveMappings ) {
          const re = stringToRegex(rule.match);

          if ( schemaOrName.id.match(re) ) {
            moved = true;
            group = rule.replace;
          }
        }

        if ( !moved ) {
          group = group.attributes.group;
        }
      }

      if ( typeof group !== 'string' ) {
        return null;
      }

      const out = _applyMapping(group, state.groupMappings, null, state.cache.groupLabel, (group) => {
        const match = group.match(/^(.*)\.k8s\.io$/);

        if ( match ) {
          return match[1].split(/\./).map(x => ucFirst(x)).join('.');
        }

        return group;
      });

      return out;
    };
  },

  groupForBasicType(state) {
    return (product, schemaId) => {
      return state.basicTypes?.[product]?.[schemaId];
    };
  },

  optionsFor(state) {
    const def = {
      isCreatable: true,
      isEditable:  true,
      isRemovable: true,
      showState:   true,
      showAge:     true,
      canYaml:     true,
    };

    return (schemaOrType) => {
      const type = (typeof schemaOrType === 'object' ? schemaOrType.id : schemaOrType);
      const found = state.typeOptions.find((entry) => {
        const re = stringToRegex(entry.match);

        return re.test(type);
      });

      const opts = Object.assign({}, def, found || {});

      return opts;
    };
  },

  isFavorite(state, getters, rootState, rootGetters) {
    return (schemaId) => {
      return rootGetters['prefs/get'](FAVORITE_TYPES).includes(schemaId) || false;
    };
  },

  typeWeightFor(state) {
    return (type, forBasic) => {
      type = type.toLowerCase();

      if ( forBasic ) {
        return state.basicTypeWeights[type] || 0;
      } else {
        return state.typeWeights[type] || 0;
      }
    };
  },

  groupWeightFor(state) {
    return (group, forBasic) => {
      group = group.toLowerCase();

      if ( forBasic ) {
        return state.basicGroupWeights[group] || 0;
      } else {
        return state.groupWeights[group] || 0;
      }
    };
  },

  getTree(state, getters, rootState, rootGetters) {
    return (product, mode, allTypes, clusterId, namespaceMode, namespaces, currentType, search) => {
      // modes: basic, used, all, favorite
      // namespaceMode: 'namespaced', 'cluster', or 'both'
      // namespaces: null means all, otherwise it will be an array of specific namespaces to include
      const isBasic = mode === BASIC;

      let searchRegex;

      if ( search ) {
        searchRegex = new RegExp(`^(.*)(${ escapeRegex(search) })(.*)$`, 'i');
      }

      const root = { children: [] };

      // Add types from shortest to longest so that parents
      // get added before children
      const keys = Object.keys(allTypes).sort((a, b) => a.length - b.length);

      for ( const type of keys ) {
        const typeObj = allTypes[type];

        if ( typeObj.schema && getters.isIgnored(typeObj.schema) ) {
          // Skip ignored groups & types
          continue;
        }

        const namespaced = typeObj.namespaced;

        if ( (namespaceMode === NAMESPACED && !namespaced ) || (namespaceMode === CLUSTER_LEVEL && namespaced) ) {
          // Skip types that are not the right namespace mode
          continue;
        }

        const count = _matchingCounts(typeObj, namespaces);
        const groupForBasicType = getters.groupForBasicType(product, typeObj.name);

        if ( typeObj.id === currentType ) {
          // If this is the type currently being shown, always show it
        } else if ( isBasic && !groupForBasicType ) {
          // If we want the basic tree only return basic types;
          continue;
        } else if ( mode === USED && count <= 0 ) {
          // If there's none of this type, ignore this entry when viewing only in-use types
          // Note: count is sometimes null, which is <= 0.
          continue;
        }

        const label = typeObj.labelKey ? rootGetters['i18n/t'](typeObj.labelKey) || typeObj.label : typeObj.label;
        const virtual = !!typeObj.virtual;
        let icon = typeObj.icon;

        if ( (!virtual || typeObj.isSpoofed ) && !icon ) {
          if ( namespaced ) {
            icon = 'folder';
          } else {
            icon = 'globe';
          }
        }

        const labelDisplay = highlightLabel(label, icon);

        if ( !labelDisplay ) {
          // Search happens in highlight and retuns null if not found
          continue;
        }

        let group;

        if ( isBasic ) {
          group = _ensureGroup(root, groupForBasicType, true);
        } else if ( mode === FAVORITE ) {
          group = _ensureGroup(root, 'starred');
        } else if ( mode === USED ) {
          group = _ensureGroup(root, `inUse::${ getters.groupLabelFor(typeObj.schema) }`);
        } else {
          group = _ensureGroup(root, typeObj.schema || typeObj.group || ROOT);
        }

        let route = typeObj.route;

        // Make the default route if one isn't set
        if (!route ) {
          route = {
            name:   'c-cluster-product-resource',
            params: {
              product,
              cluster:  clusterId,
              resource: typeObj.name,
            }
          };

          typeObj.route = route;
        }

        // Cluster ID and Product should always be set
        if ( route && typeof route === 'object' ) {
          route.params = route.params || {};
          route.params.cluster = clusterId;
          route.params.product = product;
        }

        group.children.push({
          label,
          labelDisplay,
          mode:   typeObj.mode,
          count,
          exact:  typeObj.exact || false,
          namespaced,
          route,
          name:   typeObj.name,
          weight: typeObj.weight || getters.typeWeightFor(typeObj.schema?.id || label, isBasic),
          overview: !!typeObj.overview,
        });
      }

      // Recursively sort the groups
      _sortGroup(root, mode);

      return root.children;

      // ----------------------

      function _ensureGroup(tree, schemaOrName, forBasic = false) {
        let name = getters.groupLabelFor(schemaOrName);
        const isRoot = ( name === ROOT || name.startsWith(`${ ROOT }::`) );

        if ( name && name.includes('::') ) {
          let parent;

          [parent, name] = name.split('::', 2);
          tree = _ensureGroup(tree, parent);
        }

        // Translate if an entry exists
        let label = name;
        const key = `nav.group."${ name }"`;

        if ( rootGetters['i18n/exists'](key) ) {
          label = rootGetters['i18n/t'](key);
        }

        let group = findBy(tree.children, 'name', name);

        if ( !group ) {
          group = {
            name,
            label,
            weight: getters.groupWeightFor(name, forBasic),
          };

          tree.children.push(group);
        }

        if ( isRoot ) {
          group.isRoot = true;
        }

        if ( !group.children ) {
          group.children = [];
        }

        return group;
      }

      function highlightLabel(original, icon) {
        let label = escapeHtml(original);

        if ( searchRegex ) {
          const match = label.match(searchRegex);

          if ( match ) {
            label = `${ escapeHtml(match[1]) }<span class="highlight">${ escapeHtml(match[2]) }</span>${ escapeHtml(match[3]) }`;
          } else {
            return null;
          }
        }

        if ( icon ) {
          label = `<i class="icon icon-fw icon-${ icon }"></i>${ label }`;
        }

        return label;
      }
    };
  },

  isSpoofed(state, getters, rootState, rootGetters) {
    return (type, product) => {
      product = product || rootGetters['productId'];
      const productSpoofedTypes = state.spoofedTypes[product] || [];

      return productSpoofedTypes.some(st => st.type === type);
    };
  },

  getSpoofedInstances(state, getters, rootState, rootGetters) {
    return async(type, product) => {
      product = product || rootGetters['productId'];
      const getInstances = instanceMethods[product]?.[type] || (() => []);
      const instances = await getInstances();

      instances.forEach((instance) => {
        const type = instance.type;
        const id = instance.id;
        const link = `/${ SPOOFED_PREFIX }/${ type }/${ id }`;
        const apiLink = `/${ SPOOFED_API_PREFIX }/${ type }/${ id }`;

        instance.links = {
          remove: instance.links?.remove || link,
          self:   instance.links?.self || link,
          update: instance.links?.update || link,
          view:   instance.links?.view || apiLink,
        };
        instance.isSpoofed = true;
      });

      return instances;
    };
  },

  getSpoofedInstance(state, getters, rootState, rootGetters) {
    return async(type, id, product) => {
      const productInstances = await getters.getSpoofedInstances(type, product);

      return productInstances.find( instance => instance.id === id);
    };
  },

  allSpoofedTypes(state, getters, rootState, rootGetters) {
    return Object.values(state.spoofedTypes).flat();
  },

  allSpoofedSchemas(state, getters, rootState, rootGetters) {
    return getters.allSpoofedTypes.flatMap((type) => {
      const schemas = type.schemas || [];

      return schemas.map(schema => ({
        ...schema,
        isSpoofed: true
      }));
    });
  },

  allTypes(state, getters, rootState, rootGetters) {
    return (product, mode = ALL) => {
      const module = findBy(state.products, 'name', product).inStore;
      const schemas = rootGetters[`${ module }/all`](SCHEMA);
      const counts = rootGetters[`${ module }/all`](COUNT)?.[0]?.counts || {};
      const isDev = rootGetters['prefs/get'](DEV);
      const isBasic = mode === BASIC;

      const out = {};

      for ( const schema of schemas ) {
        const attrs = schema.attributes || {};
        const count = counts[schema.id];
        const label = getters.labelFor(schema, count);
        const weight = getters.typeWeightFor(schema?.id || label, isBasic);

        if ( isBasic ) {
          // These are separate ifs so that things with no kind can still be basic
          if ( !getters.groupForBasicType(product, schema.id) ) {
            continue;
          }
        } else if ( mode === FAVORITE && !getters.isFavorite(schema.id) ) {
          continue;
        } else if ( !attrs.kind ) {
          // Skip the schemas that aren't top-level types
          continue;
        }

        out[schema.id] = {
          label,
          mode,
          weight,
          schema,
          name:        schema.id,
          namespaced:  attrs.namespaced,
          count:       count ? count.summary.count || 0 : null,
          byNamespace: count ? count.namespaces : {},
          revision:    count ? count.revision : null,
        };
      }

      // Add virtual and spoofed types
      if ( mode !== USED ) {
        const virtualTypes = state.virtualTypes[product] || [];
        const spoofedTypes = state.spoofedTypes[product] || [];
        const allTypes = [...virtualTypes, ...spoofedTypes];

        for ( const type of allTypes ) {
          const item = clone(type);
          const id = item.name;
          const weight = type.weight || getters.typeWeightFor(item.label, isBasic);

          if ( item['public'] === false && !isDev ) {
            continue;
          }

          if ( item.ifHaveType && !findBy(schemas, 'id', normalizeType(item.ifHaveType)) ) {
            continue;
          }

          if ( item.ifHaveSubTypes ) {
            const hasSome = (item.ifHaveSubTypes || []).some((type) => {
              return !!findBy(schemas, 'id', normalizeType(type));
            });

            if (!hasSome) {
              continue;
            }
          }

          if ( isBasic && !getters.groupForBasicType(product, id) ) {
            continue;
          } else if ( mode === FAVORITE && !getters.isFavorite(id) ) {
            continue;
          }

          item.mode = mode;
          item.weight = weight;
          item.label = item.label || item.name;

          out[id] = item;
        }
      }

      return out;
    };
  },

  groupByFor(state) {
    return (schema) => {
      return state.groupBy[schema.id];
    };
  },

  hideBulkActionsFor(state) {
    return (schema) => {
      return state.hideBulkActions[schema.id];
    };
  },

  headersFor(state, getters, rootState, rootGetters) {
    return (schema) => {
      const attributes = schema.attributes || {};
      const columns = attributes.columns || [];
      const typeOptions = getters['optionsFor'](schema);

      // A specific list has been provided
      if ( state.headers[schema.id] ) {
        return state.headers[schema.id].map((entry) => {
          if ( typeof entry === 'string' ) {
            const col = findBy(columns, 'name', entry);

            if ( col ) {
              return fromSchema(col, rootGetters);
            } else {
              return null;
            }
          } else {
            return entry;
          }
        }).filter(col => !!col);
      }

      // Otherwise make one up from schema
      const out = typeOptions.showState ? [STATE] : [];
      const namespaced = attributes.namespaced || false;
      let hasName = false;

      for ( const col of columns ) {
        if ( col.format === 'name' ) {
          hasName = true;
          out.push(NAME);
          if ( namespaced ) {
            out.push(NAMESPACE);
          }
        } else {
          out.push(fromSchema(col, rootGetters));
        }
      }

      if ( !hasName ) {
        insertAt(out, 1, NAME);
        if ( namespaced ) {
          insertAt(out, 2, NAMESPACE);
        }
      }

      // Age always goes last
      if ( out.includes(AGE) ) {
        removeObject(out, AGE);
        if ( typeOptions.showAge ) {
          out.push(AGE);
        }
      }

      return out;

      function fromSchema(col, rootGetters) {
        let formatter, width, formatterOpts;

        if ( (col.format === '' || col.format === 'date') && col.name === 'Age' ) {
          return AGE;
        }

        if ( col.format === 'date' || col.type === 'date' ) {
          formatter = 'Date';
          width = 120;
          formatterOpts = { multiline: true };
        }

        if ( col.type === 'number' || col.type === 'int' ) {
          formatter = 'Number';
        }

        const exists = rootGetters['i18n/exists'];
        const t = rootGetters['i18n/t'];
        const labelKey = `tableHeaders.${ col.name }`;

        return {
          name:  col.name.toLowerCase(),
          label: exists(labelKey) ? t(labelKey) : col.name,
          value: col.field.startsWith('.') ? `$${ col.field }` : col.field,
          sort:  [col.field],
          formatter,
          formatterOpts,
          width,
        };
      }
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
      } catch (e) {
        cache[type] = false;
      }

      return cache[type];
    };
  },

  hasCustomDetail(state, getters) {
    return (rawType, subType) => {
      const key = getters.componentFor(rawType, subType);
      const cache = state.cache.detail;

      if ( cache[key] !== undefined ) {
        return cache[key];
      }

      try {
        require.resolve(`@/detail/${ key }`);
        cache[key] = true;
      } catch (e) {
        cache[key] = false;
      }

      return cache[key];
    };
  },

  hasCustomEdit(state, getters) {
    return (rawType, subType) => {
      const key = getters.componentFor(rawType, subType);

      const cache = state.cache.edit;

      if ( cache[key] !== undefined ) {
        return cache[key];
      }

      try {
        require.resolve(`@/edit/${ key }`);
        cache[key] = true;
      } catch (e) {
        cache[key] = false;
      }

      return cache[key];
    };
  },

  importList(state, getters) {
    return (rawType) => {
      const type = getters.componentFor(rawType);

      return importList(type);
    };
  },

  importDetail(state, getters) {
    return (rawType, subType) => {
      const key = getters.componentFor(rawType, subType);

      return importDetail(key);
    };
  },

  importEdit(state, getters) {
    return (rawType, subType) => {
      const key = getters.componentFor(rawType, subType);

      return importEdit(key);
    };
  },

  componentFor(state, getters) {
    return (type, subType) => {
      let key = type;

      if ( subType ) {
        key = `${ type }/${ subType }`;
      }

      if ( state.cache.componentFor[key] !== undefined ) {
        return state.cache.componentFor[key];
      }

      let out = type;

      const mapping = state.typeToComponentMappings.find((mapping) => {
        const re = stringToRegex(mapping.match);

        return re.test(key);
      });

      if ( mapping ) {
        out = mapping.replace;
      } else if ( subType ) {
        // Try again without the subType
        out = getters.componentFor(type);
      }

      state.cache.componentFor[key] = out;

      return out;
    };
  },

  isIgnored(state) {
    return (schema) => {
      if ( state.cache.ignore[schema.id] !== undefined ) {
        return state.cache.ignore[schema.id];
      }

      let out = false;

      for ( const rule of state.groupIgnore ) {
        const group = schema?.attributes?.group;

        if ( group && group.match(stringToRegex(rule)) ) {
          out = true;
          break;
        }
      }

      if ( !out ) {
        for ( const rule of state.typeIgnore ) {
          if ( schema.id.match(stringToRegex(rule)) ) {
            out = true;
            break;
          }
        }
      }

      state.cache.ignore[schema.id] = out;

      return out;
    };
  },

  activeProducts(state, getters, rootState, rootGetters) {
    const knownTypes = {};
    const knownGroups = {};
    const isDev = rootGetters['prefs/get'](DEV);

    if ( state.schemaGeneration < 0 ) {
      // This does nothing, but makes activeProducts depend on schemaGeneration
      // so that it can be used to update the product list on schema change.
      return;
    }

    return state.products.filter((p) => {
      const module = p.inStore;

      if ( p['public'] === false && !isDev ) {
        return false;
      }

      if ( p.ifGetter && !rootGetters[p.ifGetter] ) {
        return false;
      }

      if ( !knownTypes[module] ) {
        const schemas = rootGetters[`${ module }/all`](SCHEMA);

        knownTypes[module] = [];
        knownGroups[module] = [];

        for ( const s of schemas ) {
          knownTypes[module].push(s._id);

          if ( s._group ) {
            addObject(knownGroups[module], s._group);
          }
        }
      }

      if ( p.ifHaveType && !knownTypes[module].find(t => t.match(stringToRegex(p.ifHaveType)) ) ) {
        return false;
      }

      if ( p.ifHaveGroup && !knownGroups[module].find(t => t.match(stringToRegex(p.ifHaveGroup)) ) ) {
        return false;
      }

      return true;
    });
  },

  isProductActive(state, getters) {
    return (name) => {
      if ( findBy(getters['activeProducts'], 'name', name) ) {
        return true;
      }

      return false;
    };
  },
};

export const mutations = {
  schemaChanged(state) {
    state.schemaGeneration = state.schemaGeneration + 1;
  },

  product(state, obj) {
    const existing = findBy(state.products, 'name', obj.name);

    if ( existing ) {
      Object.assign(existing, obj);
    } else {
      addObject(state.products, obj);
    }
  },

  virtualType(state, { product, obj }) {
    if ( !state.virtualTypes[product] ) {
      state.virtualTypes[product] = [];
    }

    const copy = clone(obj);

    copy.virtual = true;

    const existing = findBy(state.virtualTypes[product], 'name', copy.name);

    if ( existing ) {
      Object.assign(existing, copy);
    } else {
      addObject(state.virtualTypes[product], copy);
    }
  },

  spoofedType(state, { product, obj }) {
    if ( !state.spoofedTypes[product] ) {
      state.spoofedTypes[product] = [];
    }

    const copy = clone(obj);

    instanceMethods[product] = instanceMethods[product] || {};
    instanceMethods[product][copy.type] = copy.getInstances;
    delete copy.getInstances;

    copy.name = copy.type;
    copy.isSpoofed = true;
    copy.virtual = true;
    copy.schemas.forEach((schema) => {
      schema.links = {
        collection: `/${ SPOOFED_PREFIX }/${ schema.id }`,
        ...(schema.links || {})
      };
    });

    const existing = findBy(state.spoofedTypes[product], 'type', copy.type);

    if ( existing ) {
      Object.assign(existing, copy);
    } else {
      addObject(state.spoofedTypes[product], copy);
    }
  },

  basicType(state, { product, group, types }) {
    if ( !product ) {
      product = EXPLORER;
    }

    if ( !group ) {
      group = ROOT;
    }

    if ( !isArray(types) ) {
      types = [types];
    }

    if ( !state.basicTypes[product] ) {
      state.basicTypes[product] = {};
    }

    for ( const t of types ) {
      state.basicTypes[product][t] = group;
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

  groupBy(state, { type, field }) {
    state.groupBy[type] = field;
  },

  headers(state, { type, headers }) {
    state.headers[type] = headers;
  },

  hideBulkActions(state, { type, field }) {
    state.hideBulkActions[type] = field;
  },

  // weightGroup({group: 'core', weight: 99}); -- higher groups are shown first
  // These operate on group names *after* mapping but *before* translation
  weightGroup(state, {
    group, groups, weight, forBasic
  }) {
    if ( !groups ) {
      groups = [];
    }

    if ( group ) {
      groups.push(group);
    }

    const map = forBasic ? state.basicGroupWeights : state.groupWeights;

    for ( const g of groups ) {
      map[g.toLowerCase()] = weight;
    }
  },

  // weightType('Cluster' 99); -- higher groups are shown first
  // These operate on *schema* type names, before mapping
  weightType(state, {
    type, types, weight, forBasic
  }) {
    if ( !types ) {
      types = [];
    }

    if ( type ) {
      types.push(type);
    }

    const map = forBasic ? state.basicTypeWeights : state.typeWeights;

    for ( const t of types ) {
      map[t.toLowerCase()] = weight;
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

  // moveType('apps.deployment', 'Core');
  moveType(state, { match, group, weight = 5 }) {
    _addMapping(state.typeMoveMappings, match, group, weight);
  },

  componentForType(state, { match, replace }) {
    match = ensureRegex(match);
    match = regexToString(match);
    state.typeToComponentMappings.push({ match, replace });
  },

  configureType(state, options) {
    const match = regexToString(ensureRegex(options.match));

    const idx = state.typeOptions.findIndex(obj => obj.match === match);
    let obj = { ...options, match };

    if ( idx >= 0 ) {
      obj = Object.assign(obj, state.typeOptions[idx]);
      state.typeOptions.splice(idx, 1, obj);
    } else {
      const obj = Object.assign({}, options, { match });

      state.typeOptions.push(obj);
    }
  },

};

export const actions = {
  addFavorite({ dispatch, rootGetters }, type) {
    const types = rootGetters['prefs/get'](FAVORITE_TYPES) || [];

    addObject(types, type);

    dispatch('prefs/set', { key: FAVORITE_TYPES, value: types }, { root: true });
  },

  removeFavorite({ dispatch, rootGetters }, type) {
    const types = rootGetters['prefs/get'](FAVORITE_TYPES) || [];

    removeObject(types, type);

    dispatch('prefs/set', { key: FAVORITE_TYPES, value: types }, { root: true });
  },

  toggleGroup({ dispatch, rootGetters }, { group, expanded }) {
    const groups = rootGetters['prefs/get'](EXPANDED_GROUPS);

    if ( expanded ) {
      addObject(groups, group);
    } else {
      removeObject(groups, group);
    }

    dispatch('prefs/set', { key: EXPANDED_GROUPS, value: groups }, { root: true });
  },

  configureType({ commit }, options) {
    commit('configureType', options);
  }
};

function _sortGroup(tree, mode) {
  const by = ['weight:desc', 'namespaced', 'label'];

  tree.children = sortBy(tree.children, by);

  for (const entry of tree.children ) {
    if ( entry.children ) {
      _sortGroup(entry, mode);
    }
  }
}

function _matchingCounts(typeObj, namespaces) {
  // That was easy
  if ( !typeObj.namespaced || !typeObj.byNamespace || namespaces === null || typeObj.count === null) {
    return typeObj.count;
  }

  let out = 0;

  // Otherwise start with 0 and count up
  for ( const namespace of namespaces ) {
    out += typeObj.byNamespace[namespace]?.count || 0;
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

  if ( key && cache && cache[key] ) {
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

  if ( cache ) {
    cache[key] = out;
  }

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

// Regexes can't be represented in state because they don't serialize to JSON..
const regexCache = {};

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
