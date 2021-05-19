export default {
  _availableActions() {
    const out = this._standardActions;

    const restore = {
      action:     'promptRestore',
      enabled:    true,
      icon:       'icon icon-fw icon-backup-restore',
      label:      'Restore'
    };

    out.unshift(restore);

    return out;
  },

  promptRestore() {
    return () => {
      this.$dispatch('promptRestore', [this]);
    };
  },
};
