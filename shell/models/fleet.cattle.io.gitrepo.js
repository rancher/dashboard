import { set } from '@shell/utils/object';
import { insertAt } from '@shell/utils/array';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import FleetApplication from '@/shell/models/fleet-application';

function quacksLikeAHash(str) {
  if (str.match(/^[a-f0-9]{40,}$/i)) {
    return true;
  }

  return false;
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
      action:   'enablePolling',
      label:    this.t('fleet.gitRepo.actions.enablePolling.label'),
      icon:     'icon icon-endpoints_connected',
      bulkable: true,
      enabled:  !!this.links.update && !!this.spec?.disablePolling
    });

    insertAt(out, 3, {
      action:   'disablePolling',
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

  enablePolling() {
    this.spec.disablePolling = false;
    this.save();
  }

  disablePolling() {
    this.spec.disablePolling = true;
    this.save();
  }

  get github() {
    const match = (this.spec.repo || '').match(/^https?:\/\/github\.com\/(.*?)(\.git)?\/*$/);

    if (match) {
      return match[1];
    }

    return false;
  }

  get repoIcon() {
    if (this.github) {
      return 'icon icon-github';
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

  get dashboardIcon() {
    return 'icon icon-git';
  }
}
