import { set } from '@shell/utils/object';
import { insertAt } from '@shell/utils/array';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import FleetApplication from '@shell/models/fleet-application';
import FleetUtils from '@shell/utils/fleet';

const HTTPS_REGEX = /^https?:\/\/github\.com\/(.*?)(\.git)?\/*$/;
const SSH_REGEX = /^git@github\.com:.*\.git$/;

function quacksLikeAHash(str) {
  if (str.match(/^[a-f0-9]{40,}$/i)) {
    return true;
  }

  return false;
}

function parseSSHUrl(url) {
  const parts = (url || '').split(':');

  const sshUserAndHost = parts[0];
  const repoPath = parts[1]?.replace('.git', '');

  return {
    sshUserAndHost,
    repoPath
  };
}

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

  get isWebhookConfigured() {
    return !!this.status?.webhookCommit;
  }

  get github() {
    const value = this.spec.repo || '';

    const matchHttps = value.match(HTTPS_REGEX);

    if (matchHttps) {
      return matchHttps[1];
    }

    const matchSSH = value.match(SSH_REGEX);

    if (matchSSH) {
      return parseSSHUrl(matchSSH[0]).repoPath;
    }

    return false;
  }

  get dashboardIcon() {
    return FleetUtils.dashboardIcons[FLEET.GIT_REPO];
  }

  get resourceIcon() {
    if (this.github) {
      return FleetUtils.resourceIcons[FLEET.GIT_REPO];
    }

    return '';
  }

  get repoDisplay() {
    let repo = this.spec.repo || '';

    if (!repo) {
      return null;
    }

    repo = repo.replace(/.git$/, '');
    repo = repo.replace(/^https:\/\//, '');
    repo = repo.replace(/\/+$/, '');

    if (this.github) {
      return this.github;
    }

    return repo;
  }

  get commitDisplay() {
    const spec = this.spec;
    const hash = this.status?.commit?.substr(0, 7);

    if (!spec || !spec.repo) {
      return null;
    }

    if (spec.revision && quacksLikeAHash(spec.revision)) {
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

    const matchSSH = value.match(SSH_REGEX);

    if (matchSSH) {
      const { sshUserAndHost, repoPath } = parseSSHUrl(matchSSH[0]);

      value = `https://${ sshUserAndHost.replace('git@', '') }/${ repoPath }`;
    }

    return {
      value,
      display: this.repoDisplay,
      icon:    this.resourceIcon,
    };
  }

  get sourceSub() {
    return {
      value:   this.status?.commit,
      display: this.commitDisplay
    };
  }
}
