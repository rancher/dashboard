import { findBy, insertAt } from '@/utils/array';

export default {
  availableActions() {
    const out = this._standardActions;

    const removeAction = findBy(out, 'altAction', ' remove');
    let idx = out.length - 1;

    if ( removeAction ) {
      idx = out.indexOf(removeAction);
    }

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

    insertAt(out, idx, openShell);
    insertAt(out, idx + 1, openLogs);
    insertAt(out, idx + 2, { divider: true });

    return out;
  },

  openShell() {
    return () => {
      this.$dispatch('shell/defineSocket', { resource: this, action: 'openShell' }, { root: true });
    };
  },

  openLogs() {
    return () => {
      this.$dispatch('shell/defineSocket', { resource: this, action: 'openLogs' }, { root: true });
    };
  }
};
