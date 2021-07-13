export const state = function() {
  return {
    actionResources:     null,
    isShowBackUp:        false,
    isShowRestore:       false,
    isShowMigration:     false,
    isShowCloneTemplate:   false
  };
};

export const mutations = {
  toggleBackupModal(state, resources = []) {
    state.isShowBackUp = !state.isShowBackUp;
    state.actionResources = resources;
  },

  toggleRestoreModal(state, resources = []) {
    state.isShowRestore = !state.isShowRestore;
    state.actionResources = resources;
  },

  toggleMigrationModal(state, resources = []) {
    state.isShowMigration = !state.isShowMigration;
    state.actionResources = resources;
  },

  toggleCloneTemplateModal(state, resources = []) {
    state.isShowCloneTemplate = !state.isShowCloneTemplate;
    state.actionResources = resources;
  },
};

export const actions = {};
