import { set } from '@shell/utils/object';
import { insertAt } from '@shell/utils/array';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import FleetApplication from '@shell/models/fleet-application';
import FleetUtils from '@shell/utils/fleet';

export default class GitRepo extends FleetApplication {
  applyDefaults() {
    const spec = this.spec || {};
    const meta = this.metadata || {};

    meta.namespace = this.$rootGetters['workspace'];

    spec.repo = spec.repo || '';

    if (!spec.branch && !spec.revision) {
      spec.branch = 'master';
    }

    spec.paths = spec.paths || [];
    spec.clientSecretName = spec.clientSecretName || null;

    spec['correctDrift'] = { enabled: false };

    set(this, 'spec', spec);
    set(this, 'metadata', meta);
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:   'pause',
      label:    this.t('fleet.gitRepo.actions.pause.label'),
      icon:     'icon icon-pause',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:   'unpause',
      label:    this.t('fleet.gitRepo.actions.unpause.label'),
      icon:     'icon icon-play',
      bulkable: true,
      enabled:  !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:   'enablePollingAction',
      label:    this.t('fleet.gitRepo.actions.enablePolling.label'),
      icon:     'icon icon-endpoints_connected',
      bulkable: true,
      enabled:  !!this.links.update && !!this.spec?.disablePolling
    });

    insertAt(out, 3, {
      action:   'disablePollingAction',
      label:    this.t('fleet.gitRepo.actions.disablePolling.label'),
      icon:     'icon icon-endpoints_disconnected',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.disablePolling
    });

    insertAt(out, 4, {
      action:     'forceUpdate',
      label:      this.t('fleet.gitRepo.actions.forceUpdate.label'),
      icon:       'icon icon-refresh',
      bulkable:   true,
      bulkAction: 'forceUpdateBulk',
      enabled:    !!this.links.update
    });

    insertAt(out, 5, { divider: true });

    return out;
  }

  enablePollingAction() {
    this.spec.disablePolling = false;
    this.save();
  }

  disablePollingAction() {
    this.spec.disablePolling = true;
    this.save();
  }

  forceUpdate(resources = [this]) {
    this.$dispatch('promptModal', {
      componentProps: { repositories: resources },
      component:      'GitRepoForceUpdateDialog'
    });
  }

  forceUpdateBulk(resources) {
    this.$dispatch('promptModal', {
      componentProps: { repositories: resources },
      component:      'GitRepoForceUpdateDialog'
    });
  }

  get isPollingEnabled() {
    return !this.spec.disablePolling;
  }

  get isWebhookConfigured() {
    return !!this.status?.webhookCommit;
  }

  get github() {
    const value = this.spec.repo || '';

    const matchHttps = value.match(FleetUtils.GIT_HTTPS_REGEX);

    if (matchHttps) {
      return matchHttps[1];
    }

    const matchSSH = value.match(FleetUtils.GIT_SSH_REGEX);

    if (matchSSH) {
      return FleetUtils.parseSSHUrl(matchSSH[0]).repoPath;
    }

    return false;
  }

  get dashboardIcon() {
    return FleetUtils.dashboardIcons[FLEET.GIT_REPO];
  }

  get resourceIcon() {
    if (this.github) {
      return 'icon icon-github';
    }

    return FleetUtils.resourceIcons[FLEET.GIT_REPO];
  }

  get repoDisplay() {
    let repo = this.spec.repo || '';

    if (!repo) {
      return null;
    }

    if (this.github) {
      return this.github;
    }

    repo = repo.replace(/.git$/, '');
    repo = repo.replace(/^https:\/\//, '');
    repo = repo.replace(/\/+$/, '');

    return repo;
  }

  get commitDisplay() {
    const spec = this.spec;
    const hash = this.status?.commit?.substr(0, 7);

    if (!spec || !spec.repo) {
      return null;
    }

    if (spec.revision && FleetUtils.quacksLikeAHash(spec.revision)) {
      return spec.revision.substr(0, 7);
    } else if (spec.revision) {
      return spec.revision;
    } else if (spec.branch) {
      return spec.branch + (hash ? ` @ ${ hash }` : '');
    }

    return hash;
  }

  get bundles() {
    return this.$getters['matching'](FLEET.BUNDLE, { [FLEET_ANNOTATIONS.REPO_NAME]: this.name }, this.namespace);
  }

  get bundleDeployments() {
    return this.$getters['matching'](FLEET.BUNDLE_DEPLOYMENT, { [FLEET_ANNOTATIONS.REPO_NAME]: this.name });
  }

  get source() {
    let value = this.spec.repo || '';

    const matchHttps = value.match(FleetUtils.GIT_HTTPS_REGEX);
    const matchSSH = value.match(FleetUtils.GIT_SSH_REGEX);

    if (matchSSH) {
      const { sshUserAndHost, repoPath } = FleetUtils.parseSSHUrl(matchSSH[0]);

      value = `https://${ sshUserAndHost.replace('git@', '') }/${ repoPath }`;
    }

    return {
      value,
      display:  this.repoDisplay,
      icon:     this.resourceIcon,
      showLink: !!(matchHttps || matchSSH)
    };
  }

  get sourceSub() {
    return {
      value:   this.status?.commit,
      display: this.commitDisplay
    };
  }

  get fullDetailPageOverride() {
    return true;
  }
}
