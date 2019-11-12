import { isArray, filterBy, removeObjects, addObjects } from '@/utils/array';

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

    // Find and add all the actions for all the nodes so that we know
    // what all the possible actions are
    for ( const node of all ) {
      for ( const act of node.availableActions ) {
        if ( act.bulkable ) {
          _add(map, act, false);
        }
      }
    }

    // Go through all the selected items and add the actions (which were already identified above)
    // as availalable for some (or all) of the selected nodes
    for ( const node of selected ) {
      for ( const act of node.availableActions ) {
        if ( act.bulkable ) {
          _add(map, act);
        }
      }
    }

    // If there's no items actually selected, we want to see all the actions
    // so you know what exists, but have them all be disabled since there's nothing to do them on.
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

    return { ...out };
  },

  isSelected: state => (resource) => {
    return state.tableSelected.includes(resource);
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

  update(state, { toAdd, toRemove }) {
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

let anon = 0;

function _add(map, act, incrementCounts = true) {
  let id = act.action;

  if ( !id ) {
    id = `anon${ anon }`;
    anon++;
  }

  let obj = map[id];

  if ( !obj ) {
    obj = Object.assign({}, act);
    map[id] = obj;
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

  const promises = [];

  for ( const resource of resources ) {
    const fn = resource[action.action];

    if ( fn ) {
      promises.push(fn.apply(resource, args));
    }
  }

  return Promise.all(promises);
}
