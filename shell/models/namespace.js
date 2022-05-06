import SYSTEM_NAMESPACES from '@shell/config/system-namespaces';
import {
  PROJECT, SYSTEM_NAMESPACE, ISTIO as ISTIO_LABELS, FLEET, RESOURCE_QUOTA
} from '@shell/config/labels-annotations';
import { ISTIO, MANAGEMENT } from '@shell/config/types';

import { get, set } from '@shell/utils/object';
import { escapeHtml } from '@shell/utils/string';
import { insertAt, isArray } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';
import Vue from 'vue';

const OBSCURE_NAMESPACE_PREFIX = [
  'c-', // cluster namespace
  'p-', // project namespace
  'user-', // user namespace
  'local', // local namespace
];

export default class Namespace extends SteveModel {
  applyDefaults() {
    set(this, 'disableOpenApiValidation', false);
  }

  get _availableActions() {
    const out = super._availableActions;

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

    if (this.$rootGetters['isRancher'] && !this.$rootGetters['isSingleVirtualCluster']) {
      insertAt(out, 0, {
        action:     'move',
        label:      this.t('namespace.move'),
        bulkable:   true,
        bulkAction: 'move',
        enabled:    true,
        icon:       'icon icon-fork',
        weight:     3,
      });
    }

    return out;
  }

  move(resources = this) {
    this.$dispatch('promptMove', resources);
  }

  get isSystem() {
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
  }

  get isFleetManaged() {
    return get(this, `metadata.labels."${ FLEET.MANAGED }"`) === 'true';
  }

  // These are namespaces that are created by rancher to serve purposes in the background but the user shouldn't have
  // to worry themselves about them.
  get isObscure() {
    return OBSCURE_NAMESPACE_PREFIX.some(prefix => this.metadata.name.startsWith(prefix)) && this.isSystem;
  }

  get projectId() {
    const projectAnnotation = this.metadata?.annotations?.[PROJECT] || '';

    return projectAnnotation.split(':')[1] || null;
  }

  get project() {
    if ( !this.projectId || !this.$rootGetters['isRancher'] ) {
      return null;
    }

    const clusterId = this.$rootGetters['currentCluster']?.id;
    const project = this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ this.projectId }`);

    return project;
  }

  get groupByLabel() {
    const name = this.project?.nameDisplay;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.project', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAProject');
    }
  }

  get projectNameSort() {
    return this.project?.nameSort || '';
  }

  get istioInstalled() {
    const schema = this.$rootGetters['cluster/schemaFor'](ISTIO.GATEWAY);

    return !!schema;
  }

  get injectionEnabled() {
    return this.labels[ISTIO_LABELS.AUTO_INJECTION] === 'enabled';
  }

  enableAutoInjection(namespaces = this, enable = true) {
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
  }

  disableAutoInjection(namespaces = this) {
    this.enableAutoInjection(namespaces, false);
  }

  get confirmRemove() {
    return true;
  }

  get listLocation() {
    if (this.$rootGetters['isSingleVirtualCluster']) {
      return { name: 'c-cluster-product-resource' };
    }

    return { name: this.$rootGetters['isRancher'] ? 'c-cluster-product-projectsnamespaces' : 'c-cluster-product-namespaces' };
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get doneOverride() {
    return this.listLocation;
  }

  get resourceQuota() {
    return JSON.parse(this.metadata.annotations[RESOURCE_QUOTA] || `{"limit":{}}`);
  }

  set resourceQuota(value) {
    Vue.set(this.metadata.annotations, RESOURCE_QUOTA, JSON.stringify(value));
  }
}
