import { parse } from '@shell/utils/url';
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
      action:   'enablePollingAction',
      label:    this.t('fleet.helmOp.actions.enablePolling.label'),
      icon:     'icon icon-endpoints_connected',
      bulkable: true,
      enabled:  !!this.links.update && !!this.spec?.disablePolling
    });

    insertAt(out, 3, {
      action:   'disablePollingAction',
      label:    this.t('fleet.helmOp.actions.disablePolling.label'),
      icon:     'icon icon-endpoints_disconnected',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.disablePolling
    });

    insertAt(out, 4, {
      action:     'forceUpdate',
      label:      this.t('fleet.helmOp.actions.forceUpdate.label'),
      icon:       'icon icon-refresh',
      bulkable:   true,
      bulkAction: 'forceUpdateBulk',
      enabled:    !!this.links.update
    });

    insertAt(out, 5, { divider: true });

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

  github(value) {
    const url = (value || '');

    const matchHttps = url.match(FleetUtils.HTTPS_REGEX);

    if (matchHttps) {
      return matchHttps[1];
    }

    const matchSSH = url.match(FleetUtils.SSH_REGEX);

    if (matchSSH) {
      return FleetUtils.parseSSHUrl(matchSSH[0]).repoPath;
    }

    return false;
  }

  repoDisplay(repo) {
    if (!repo) {
      return null;
    }

    const github = this.github(repo);

    if (github) {
      return github;
    }

    repo = repo.replace(/.git$/, '');
    repo = repo.replace(/^https:\/\//, '');
    repo = repo.replace(/^oci:\/\//, '');
    repo = repo.replace(/\/+$/, '');

    return repo;
  }

  /**
   *  Source type examples:
   *
   *  tarball:
   *    chart: https://github.com/rancher/fleet-helm-charts/releases/download/fleet-0.12.1-beta.2/fleet-0.12.1-beta.2.tgz
   *  repo:
   *    repo: https://rancher.github.io/fleet-helm-charts/
   *    chart: fleet-agent
   *    version: 0.12.1-beta.2
   *  oci:
   *    chart: oci://ghcr.io/rancher/fleet-test-configmap-chart
   *    version: the-tag
   */
  get sourceType() {
    if (this.spec.helm?.repo && this.spec.helm?.chart) {
      return SOURCE_TYPE.REPO;
    }

    if (this.spec.helm?.chart?.startsWith('oci://')) {
      return SOURCE_TYPE.OCI;
    }

    if (this.spec.helm?.chart) {
      return SOURCE_TYPE.TARBALL;
    }

    return null;
  }

  get source() {
    let value = '';

    switch (this.sourceType) {
    case SOURCE_TYPE.REPO:
      value = this.spec.helm?.repo || '';
      break;
    case SOURCE_TYPE.OCI: {
      const parsed = parse(this.spec.helm?.chart || '');

      value = parsed?.host ? `oci://${ parsed?.host }` : '';
      break;
    }
    case SOURCE_TYPE.TARBALL:
      value = this.spec.helm?.chart || ''; // TODO ellipsis and tooltip
    }

    const matchHttps = value.match(FleetUtils.HTTPS_REGEX);
    const matchOCI = value.match(FleetUtils.OCI_REGEX);
    const matchSSH = value.match(FleetUtils.SSH_REGEX);

    if (matchSSH) {
      const { sshUserAndHost, repoPath } = FleetUtils.parseSSHUrl(matchSSH[0]);

      value = `https://${ sshUserAndHost.replace('git@', '') }/${ repoPath }`;
    }

    return {
      value,
      display:  this.repoDisplay(value),
      icon:     'icon icon-application',
      showLink: matchHttps || matchSSH || matchOCI
    };
  }

  get sourceSub() {
    let chart = '';
    const version = this.spec.helm.version || '';

    switch (this.sourceType) {
    case SOURCE_TYPE.REPO:
      chart = this.spec.helm.chart || '';
      break;
    case SOURCE_TYPE.OCI: {
      const parsed = parse(this.spec.helm.chart || '');

      chart = parsed?.path ? parsed?.path.substring(1) : '';
      break;
    }
    }

    const value = chart && version ? chart.concat(':', version) : chart;

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
