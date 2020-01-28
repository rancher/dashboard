import { findBy, insertAt } from '@/utils/array';
import { REMAP_STATE, STATES, DEFAULT_COLOR } from '@/plugins/steve/resource-instance';

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

      if ( REMAP_STATE[state] ) {
        return REMAP_STATE[state];
      }

      return state;
    };
  },

  containerStateColor() {
    return (container) => {
      const state = this.containerStateDisplay(container);
      const key = (state || '').toLowerCase();
      let color;

      if ( STATES[key] && STATES[key].color ) {
        color = this.maybeFn(STATES[key].color);
      }

      if ( !color ) {
        color = DEFAULT_COLOR;
      }

      return `text-${ color }`;
    };
  }

};
