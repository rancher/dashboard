import { MutationTree, GetterTree, ActionTree } from 'vuex';
import Cookie, { ICookie, ICookieGetOpts } from 'cookie-universal';

type State = { cookies: ICookie };
const options = { parseJSON: true };
const state = (): State => ({ cookies: Cookie(undefined, undefined, options.parseJSON) });

const getters: GetterTree<State, any> = {
  get(state) {
    return ({ key, options }: {key: string, options?: ICookieGetOpts}) => state.cookies.get(key, options);
  }
};
const mutations: MutationTree<State> = {
  set(state, { key, value, options }) {
    return state.cookies.set(key, value, options);
  },

  remove(state, { key }) {
    return state.cookies.remove(key);
  },
};
const actions: ActionTree<State, any> = {};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
