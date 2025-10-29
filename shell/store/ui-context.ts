interface Context {
  tag: string;
  value: any;
  hookId?: string;
  description?: string;
  icon?: string;
}

interface Element {
  id: number;
  context: Context
}

interface State {
  idCounter: number;
  elements: Record<string, Element>;
}

export const state = function(): State {
  return {
    idCounter: 0,
    elements:  {}
  };
};

export const getters = {
  all: (state: State) => {
    return Object.values(state.elements)
      .map((e) => e.context)
      .sort((a, b) => (a.tag || '').localeCompare(b.tag || '') || 0);
  },
};

export const mutations = {
  add(state: State, element: Element) {
    state.elements[element.id] = element;
  },

  update(state: State, element: Element) {
    const existingElement = state.elements[element.id];

    if (existingElement) {
      existingElement.context = element.context;
    }
  },

  remove(state: State, element: Element) {
    delete state.elements[element.id];
  }
};

let id = null;

export const actions = {
  add({ commit, state }: { commit: Function, state: State }, context: Context) {
    if (context?.value === undefined || !context?.tag) {
      throw new Error(`[ui-context] context {{${ JSON.stringify(context) }}} is not valid`);
    }

    id = `ctx-${ state.idCounter++ }`;

    commit('add', { id, context });

    return id;
  },

  update({ commit, state }: { commit: Function, state: State }, element: Element) {
    const old = state.elements[element.id];

    if (!old) {
      throw new Error(`[ui-context] element with id {{${ element.id }}} not found`);
    }

    commit('update', element);
  },

  remove({ commit, state }: { commit: Function, state: State }, id: number) {
    const element = state.elements[id];

    if (!element) {
      throw new Error(`[ui-context] element with id {{${ id }}} not found`);
    }

    commit('remove', element);
  }
};
