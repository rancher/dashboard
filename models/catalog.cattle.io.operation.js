import { findBy, insertAt } from '@/utils/array';
import { ucFirst } from '@/utils/string';

export default {
  availableActions() {
    const out = this._standardActions;

    const removeAction = findBy(out, 'altAction', ' remove');
    let idx = out.length - 1;

    if ( removeAction ) {
      idx = out.indexOf(removeAction);
    }

    const openLogs = {
      action:     'openLogs',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      this.t('action.openLogs'),
      total:      1,
    };

    insertAt(out, idx + 1, openLogs);
    insertAt(out, idx + 2, { divider: true });

    return out;
  },

  openLogs() {
    return () => {
      this.$dispatch('wm/open', {
        id:        `${ this.id }-logs`,
        label:     `${ ucFirst(this.status.action) } ${ this.status.namespace }:${ this.status?.releaseName || 'chart' }`,
        icon:      'file',
        component: 'ContainerLogs',
        attrs:     {
          pod: this, // Not quite a pod, but close enough
          url: this.links.logs,
        }
      }, { root: true });
    };
  },
};
