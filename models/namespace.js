import SYSTEM_NAMESPACES from '@/config/system-namespaces';
import { PROJECT, SYSTEM_NAMESPACE, ISTIO as ISTIO_LABELS } from '@/config/labels-annotations';
import { ISTIO, MANAGEMENT } from '@/config/types';

import { escapeHtml } from '@/utils/string';
import { insertAt, isArray } from '@/utils/array';

export default {

  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, { divider: true });
    if (this.istioInstalled) {
      insertAt(out, 0, {
        action:     'enableAutoInjection',
        label:      this.t('namespace.enableAutoInjection'),
        bulkable:   true,
        bulkAction: 'enableAutoInjection',
        enabled:    !this.injectionEnabled,
        icon:       'icon icon-plus',
        weight:     2

      });
      insertAt(out, 0, {
        action:     'disableAutoInjection',
        label:      this.t('namespace.disableAutoInjection'),
        bulkable:   true,
        bulkAction: 'disableAutoInjection',
        enabled:    this.injectionEnabled,
        icon:       'icon icon-minus',
        weight:     1,
      });
    }

    return out;
  },

  isSystem() {
    if ( this.metadata?.annotations?.[SYSTEM_NAMESPACE] === 'true' ) {
      return true;
    }

    if ( SYSTEM_NAMESPACES.includes(this.metadata.name) ) {
      return true;
    }

    if ( this.metadata.name.endsWith('-system') ) {
      return true;
    }

    if ( this.project ) {
      return this.project.isSystem;
    }

    return false;
  },

  projectId() {
    return this.metadata?.labels?.[PROJECT] || null;
  },

  project() {
    if ( !this.projectId || !this.$rootGetters['isMultiCluster'] ) {
      return null;
    }

    const clusterId = this.$rootGetters['currentCluster'].id;
    const project = this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ this.projectId }`);

    return project;
  },

  groupByLabel() {
    const name = this.project?.nameDisplay;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.project', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAProject');
    }
  },

  projectNameSort() {
    return this.project?.nameSort || '';
  },

  istioInstalled() {
    const schema = this.$rootGetters['cluster/schemaFor'](ISTIO.GATEWAY);

    return !!schema;
  },

  injectionEnabled() {
    return this.labels[ISTIO_LABELS.AUTO_INJECTION] === 'enabled';
  },

  enableAutoInjection() {
    return (namespaces = this, enable = true) => {
      if (!isArray(namespaces)) {
        namespaces = [namespaces];
      }
      namespaces.forEach((ns) => {
        if (!enable && ns?.metadata?.labels) {
          delete ns.metadata.labels[ISTIO_LABELS.AUTO_INJECTION];
        } else {
          if (!ns.metadata.labels) {
            ns.metadata.labels = {};
          }
          ns.metadata.labels[ISTIO_LABELS.AUTO_INJECTION] = 'enabled';
        }
        ns.save();
      });
    };
  },

  disableAutoInjection() {
    return (namespaces = this) => {
      this.enableAutoInjection(namespaces, false);
    };
  },
};
