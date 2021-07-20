export const state = function() {
  return {
    actionResources:   null,
    isShowMaintenance: false,
    isShowCordon:      false,
  };
};

export const mutations = {
  toggleMaintenanceModal(state, resources = []) {
    state.isShowMaintenance = !state.isShowMaintenance;
    state.actionResources = resources;
  },

  toggleCordonModal(state, resources = []) {
    state.isShowCordon = !state.isShowCordon;
    state.actionResources = resources;
  },
};

export const actions = {};
