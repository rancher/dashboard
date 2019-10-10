
export default {
  availableActions() {
    const out = this._availableActions;
    const openShell = {
      action:     'openShell',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'Execute Shell',
      total:      1,
    };
    const openLogs = {
      action:     'openLogs',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'View Logs',
      total:      1,
    };

    out.push(openShell, openLogs);

    return out;
  },

  openShell() {
    return () => {
      console.log('this in openShell: ', this);
      this.$dispatch('shell/defineSocket', { resource: this, action: 'openShell' }, { root: true });
    };
  },

  openLogs() {
    return () => {
      this.$dispatch('shell/defineSocket', { resource: this, action: 'openLogs' }, { root: true });
    };
  }
};
