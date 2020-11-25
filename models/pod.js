import { findBy, insertAt } from '@/utils/array';
import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';

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

  defaultContainerName() {
    const containers = this.spec.containers;
    const desirable = containers.filter(c => c.name !== 'istio-proxy');

    if ( desirable.length ) {
      return desirable[0].name;
    }

    return containers[0]?.name;
  },

  openShell() {
    return () => {
      this.$dispatch('wm/open', {
        id:        `${ this.id }-shell`,
        label:     this.nameDisplay,
        icon:      'terminal',
        component: 'ContainerShell',
        attrs:     {
          pod:       this,
          container: this.defaultContainerName
        }
      }, { root: true });
    };
  },

  openLogs() {
    return () => {
      this.$dispatch('wm/open', {
        id:        `${ this.id }-logs`,
        label:     this.nameDisplay,
        icon:      'file',
        component: 'ContainerLogs',
        attrs:     {
          pod:       this,
          container: this.defaultContainerName
        }
      }, { root: true });
    };
  },

  containerStateDisplay() {
    return (container) => {
      const state = Object.keys(container.state || {})[0];

      return stateDisplay(state);
    };
  },

  containerStateColor() {
    return (container) => {
      const state = Object.keys(container.state || {})[0];

      return colorForState(state);
    };
  },

  imageNames() {
    return this.spec.containers.reduce((all, container) => {
      all.push(container.image);

      return all;
    }, []);
  },

  details() {
    const out = [
      {
        label:   this.t('workload.detailTop.podIP'),
        content: this.status.podIP
      },
    ];

    return out;
  },
};
