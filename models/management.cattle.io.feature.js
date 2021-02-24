export default {

  state() {
    return this.enabled ? 'active' : 'disabled';
  },

  enabled() {
    return (this.spec.value !== null) ? this.spec.value : this.status.default;
  },

  restartRequired() {
    return !this.status.dynamic;
  },

  canYaml() {
    return false;
  },

  _availableActions() {
    const out = this._standardActions;
    const state = this.enabled;

    // Prepend action to enable or disable this feature flag
    const enableAction = {
      action:  'toggleFeatureFlag',
      label:   state ? 'Deactivate' : 'Activate',
      icon:    'icon icon-edit',
      enabled:  true,
    };

    out.unshift(enableAction);

    return out;
  },

  toggleFeatureFlag() {
    return (resources = this) => {
      this.$dispatch('promptUpdate', resources);
    };
  }

};
