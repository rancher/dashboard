import {
  isArray, filterBy, removeObject, removeObjects, addObject, addObjects
} from '@/utils/array';

export const state = function() {
  return {
    show:          false,
    tableSelected: [],
    tableAll:      [],
    resources:     [],
    elem:          null,
    event:         null,
  };
};

export const getters = {
  showing:       state => state.show,
  elem:          state => state.elem,
  event:         state => state.event,
  tableSelected: state => state.tableSelected || [],

  forTable(state) {
    let disableAll = false;
    let selected = state.tableSelected;
    const all = state.tableAll;

    if ( !selected ) {
      return [];
    }

    if ( !selected.length ) {
      if ( !all ) {
        return [];
      }

      const firstNode = all[0];

      selected = firstNode ? [firstNode] : [];
      disableAll = true;
    }

    const map = {};

    for ( const node of all ) {
      for ( const act of node.availableActions ) {
        if ( act.bulkable ) {
          _add(map, act, false);
        }
      }
    }

    for ( const node of selected ) {
      for ( const act of node.availableActions ) {
        if ( act.bulkable ) {
          _add(map, act);
        }
      }
    }

    const out = _filter(map, disableAll);

    return out;
  },

  options(state) {
    let selected = state.resources;

    if ( !selected ) {
      return [];
    }

    if ( !isArray(selected) ) {
      selected = [];
    }

    const map = {};

    for ( const node of selected ) {
      for ( const act of node.availableActions ) {
        _add(map, act);
      }
    }

    const out = _filter(map);

    return out;
  }
};

export const mutations = {
  setTable(state, { table, clearSelection = false }) {
    const selected = state.tableSelected;

    state.tableAll = table;

    if ( clearSelection ) {
      state.tableSelected = [];
    } else {
      // Remove items that are no longer visible from the selection
      const toRemove = [];

      for ( const cur of state.tableSelected ) {
        if ( !table.includes(cur) ) {
          toRemove.push(cur);
        }
      }

      removeObjects(selected, toRemove);
    }
  },

  toggleSingle(state, resource) {
    if ( state.tableSelected.includes(resource) ) {
      addObject(state.tableSelected, resource);
    } else {
      removeObject(state.tableSelected, resource);
    }
  },

  toggleMulti(state, { toAdd, toRemove }) {
    const selected = state.tableSelected;

    if (toRemove && toRemove.length) {
      removeObjects(selected, toRemove);
    }

    if (toAdd.length) {
      addObjects(selected, toAdd);
    }
  },

  show(state, { resources, elem, event }) {
    if ( !isArray(resources) ) {
      resources = [resources];
    }

    state.resources = resources;
    state.elem = elem;
    state.event = event;
    state.show = true;
  },

  hide(state) {
    state.show = false;
    state.resources = null;
    state.elem = null;
  },
};

export const actions = {
  executeTable({ state }, { action, args }) {
    return _execute(state.tableSelected, action, args);
  },

  execute({ state }, { action, args }) {
    return _execute(state.resources, action, args);
  },
};

// -----------------------------

function _add(map, act, incrementCounts = true) {
  let obj = map[act.action];

  if ( !obj ) {
    obj = Object.assign({}, act);
    map[act.action] = obj;
    obj.allEnabled = false;
  }

  if ( act.enabled === false ) {
    obj.allEnabled = false;
  } else {
    obj.anyEnabled = true;
  }

  if ( incrementCounts ) {
    obj.available = (obj.available || 0) + (act.enabled === false ? 0 : 1 );
    obj.total = (obj.total || 0) + 1;
  }

  return obj;
}

function _filter(map, disableAll = false) {
  const out = filterBy(Object.values(map), 'anyEnabled', true);

  for ( const act of out ) {
    if ( disableAll ) {
      act.enabled = false;
    } else {
      act.enabled = ( act.available >= act.total );
    }
  }

  return out;
}

function _execute(resources, action, args) {
  args = args || [];

  if ( resources.length > 1 && action.bulkAction ) {
    const fn = resources[0][action.bulkAction];

    if ( fn ) {
      return fn.call(resources[0], resources, ...args);
    }
  }

  for ( const resource of resources ) {
    const fn = resource[action.action];

    if ( fn ) {
      return fn.apply(resource, args);
    }
  }

  throw new Error(`Unknown action: ${ action.action }`);
}
