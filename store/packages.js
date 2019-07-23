export const state = () => ({

export const mutations = {
  add(state, pkg) {
    state.list.push(pkg);
  } 
}
