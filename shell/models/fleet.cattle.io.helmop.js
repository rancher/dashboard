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

    insertAt(out, 5, { divider: true });

    return out;
  }

  get dashboardIcon() {
    return FleetUtils.dashboardIcons[FLEET.HELM_OP];
  }

  get resourceIcon() {
    return FleetUtils.resourceIcons[FLEET.HELM_OP];
  }

  github(value) {
    const url = (value || '');

    const matchHttps = url.match(FleetUtils.GIT_HTTPS_REGEX);

    if (matchHttps) {
      return matchHttps[1];
    }

    const matchSSH = url.match(FleetUtils.GIT_SSH_REGEX);

    if (matchSSH) {
      return FleetUtils.parseSSHUrl(matchSSH[0]).repoPath;
    }

    return false;
  }

  sourceDisplay(repo) {
    if (!repo) {
      return null;
    }

    const github = this.github(repo);

    if (github) {
      return github;
    }

    repo = repo.replace(/.git$/, '');
    repo = repo.replace(/^https:\/\//, '');
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
   *    repo: oci://ghcr.io/rancher/fleet-test-configmap-chart
   *    version: the-tag
   */
  get sourceType() {
    if (this.spec.helm?.repo?.startsWith('oci://')) {
      return SOURCE_TYPE.OCI;
    }

    if (this.spec.helm?.repo && this.spec.helm?.chart) {
      return SOURCE_TYPE.REPO;
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
      const parsed = parse(this.spec.helm?.repo || '');

      value = parsed?.host ? `oci://${ parsed.host }` : '';
      break;
    }
    case SOURCE_TYPE.TARBALL:
      value = this.spec.helm?.chart || '';
    }

    const matchHttps = value.match(FleetUtils.HTTP_REGEX);
    const matchSSH = value.match(FleetUtils.GIT_SSH_REGEX);

    if (matchSSH) {
      const { sshUserAndHost, repoPath } = FleetUtils.parseSSHUrl(matchSSH[0]);

      value = `https://${ sshUserAndHost.replace('git@', '') }/${ repoPath }`;
    }

    return {
      value,
      display:  this.sourceDisplay(value),
      icon:     'icon icon-application',
      showLink: !!(matchHttps || matchSSH)
    };
  }

  get sourceSub() {
    // Version label
    const semanticVersion = this.spec.helm?.version || '';
    const installedVersion = this.status?.version || '';

    let labelVersion = semanticVersion || installedVersion || '';

    if (semanticVersion && installedVersion && semanticVersion !== installedVersion) {
      labelVersion = `${ semanticVersion } -> ${ installedVersion }`;
    }

    // Chart label
    let chart = '';

    switch (this.sourceType) {
    case SOURCE_TYPE.REPO:
      chart = this.spec.helm.chart || '';
      break;
    case SOURCE_TYPE.OCI: {
      const parsed = parse(this.spec.helm.repo || '');

      chart = parsed?.path ? parsed?.path.substring(1) : '';
      break;
    }
    }

    // Concat chart label and version label
    let value = chart || labelVersion || '';

    if (chart && labelVersion) {
      value = `${ chart } : ${ labelVersion }`;
    }

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

  get fullDetailPageOverride() {
    return true;
  }
}
