
import { insertAt } from '@shell/utils/array';
import { set } from '@shell/utils/object';
import { SOURCE_TYPE } from '@shell/config/product/fleet';
import FleetUtils from '@shell/utils/fleet';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import FleetApplication from '@shell/models/fleet-application';

export default class HelmOp extends FleetApplication {
  applyDefaults() {
    const spec = this.spec || {};
    const meta = this.metadata || {};

    meta.namespace = this.$rootGetters['workspace'];

    spec.helm = spec.helm || {};

    spec['correctDrift'] = { enabled: false };

    set(this, 'spec', spec);
    set(this, 'metadata', meta);
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:   'pause',
      label:    this.t('fleet.helmOp.actions.pause.label'),
      icon:     'icon icon-pause',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:   'unpause',
      label:    this.t('fleet.helmOp.actions.unpause.label'),
      icon:     'icon icon-play',
      bulkable: true,
      enabled:  !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:     'forceUpdate',
      label:      this.t('fleet.helmOp.actions.forceUpdate.label'),
      icon:       'icon icon-refresh',
      bulkable:   true,
      bulkAction: 'forceUpdateBulk',
      enabled:    !!this.links.update
    });

    insertAt(out, 3, { divider: true });

    return out;
  }

  forceUpdate(resources = [this]) {
    this.$dispatch('promptModal', {
      componentProps: { helmOps: resources },
      component:      'HelmOpForceUpdateDialog'
    });
  }

  forceUpdateBulk(resources) {
    this.$dispatch('promptModal', {
      componentProps: { helmOps: resources },
      component:      'HelmOpForceUpdateDialog'
    });
  }

  get dashboardIcon() {
    return FleetUtils.dashboardIcons[FLEET.HELM_OP];
  }

  get resourceIcon() {
    return FleetUtils.resourceIcons[FLEET.HELM_OP];
  }

  get sourceType() {
    let out = SOURCE_TYPE.REPO;

    if (this.spec.helm?.repo) {
      if (this.spec.helm.repo.startsWith('oci://')) {
        out = SOURCE_TYPE.OCI;
      }
    } else if (this.spec.helm?.chart) {
      if (this.spec.helm.chart.startsWith('https://')) {
        out = SOURCE_TYPE.TARBALL;
      }
    }

    return out;
  }

  get source() {
    let value = '';

    switch (this.sourceType) {
    case SOURCE_TYPE.TARBALL:
      value = this.spec.helm.chart || '';
      break;
    default:
      value = this.spec.helm.repo || '';
    }

    return {
      value,
      display: value,
      icon:    'icon icon-application'
    };
  }

  get sourceSub() {
    let chart = '';
    let version = '';

    if (this.sourceType !== SOURCE_TYPE.TARBALL) {
      chart = this.spec.helm.chart;
      version = this.spec.helm.version;
    }

    const value = chart?.concat(':', version);

    return {
      value,
      display: value,
    };
  }

  get bundles() {
    return this.$getters['matching'](FLEET.BUNDLE, { [FLEET_ANNOTATIONS.HELM_NAME]: this.name }, this.namespace);
  }

  get bundleDeployments() {
    return this.$getters['matching'](FLEET.BUNDLE_DEPLOYMENT, { [FLEET_ANNOTATIONS.HELM_NAME]: this.name });
  }
}
