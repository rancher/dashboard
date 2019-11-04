import day from 'dayjs';
import { insertAt } from '@/utils/array';
import { ADD_SIDECAR, _FLAGGED } from '@/config/query-params';
import { escapeHtml } from '@/utils/string';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';

export default {
  app() {
    return this.spec.app || this.status.computedApp || this.metadata.name;
  },

  version() {
    return this.spec.version || this.status.computedVersion;
  },

  nameDisplay() {
    return `${ this.app } (${ this.version })`;
  },

  namespaceNameDisplay() {
    const namespace = this.metadata.namespace;
    const name = this.metadata.name || this.id;

    return `${ namespace }:${ name }`;
  },

  namespaceApp() {
    return `${ this.metadata.namespace }:${ this.app }`;
  },

  imageDisplay() {
    return (this.spec.image || '')
      .replace(/^index.docker.io\//i, '')
      .replace(/@sha256:[0-9a-f]+$/i, '')
      .replace(/:latest$/i, '')
      .replace(/localhost:5442\/(.*)/i, '$1 (local)');
  },

  createdDisplay() {
    const dateFormat = escapeHtml( this.$rootGetters['prefs/get'](DATE_FORMAT));
    const timeFormat = escapeHtml( this.$rootGetters['prefs/get'](TIME_FORMAT));

    return day(this.metadata.creationTimestamp).format(`${ dateFormat } ${ timeFormat }`);
  },

  versionWithDateDisplay() {
    return `${ this.version } (${ this.createdDisplay })`;
  },

  scales() {
    const status = this.status || {};
    let scaleStatus = status.scaleStatus;
    let hasStatus = true;

    if ( !scaleStatus ) {
      hasStatus = false;
      scaleStatus = {};
    }

    const spec = (typeof this.spec.replicas === 'undefined' ? 1 : this.spec.replicas || 0);
    const available = scaleStatus.available || 0;
    const current = (typeof this.status.computedReplicas === 'undefined' ? available : status.computedReplicas || 0);
    const unavailable = scaleStatus.unavailable || 0;
    const global = this.spec.global === true;

    let desired = spec;

    if ( global ) {
      desired = current;
    } else if ( this._local.pendingScale >= 0 ) {
      desired = this._local.pendingScale;
    }

    const missing = desired - available - unavailable;

    return {
      hasStatus,
      global,
      current,
      desired,
      available,
      unavailable,
      starting:    missing > 0 ? missing : 0,
      stopping:    missing < 0 ? -1 * missing : 0,
    };
  },

  showDesiredScale() {
    const scales = this.scales;

    return !scales.global && scales.current !== scales.desired;
  },

  complexScale() {
    const { stopping, starting, unavailable } = this.scales;

    return stopping !== 0 || starting !== 0 || unavailable !== 0;
  },

  scaleParts() {
    const {
      available, unavailable, starting, stopping
    } = this.scales;
    const out = [
      {
        label:     'Available',
        color:     'bg-success',
        textColor: 'text-success',
        value:      available
      },

      {
        label:     'Unavailable',
        color:     'bg-error',
        textColor: 'text-error',
        value:     unavailable
      },
    ];

    if ( starting ) {
      out.push({
        label:     'Starting',
        color:     'bg-info',
        textColor: 'text-info',
        value:     starting
      });
    }

    if ( stopping ) {
      out.push({
        label:     'Stopping',
        color:     'bg-warning',
        textColor: 'text-warning',
        value:     stopping
      });
    }

    return out;
  },

  scaleUp() {
    return () => {
      let scale;

      if ( this.scales.global ) {
        return;
      }

      if ( this._local.scaleTimer ) {
        scale = this._local.pendingScale;
      } else {
        scale = this.spec.scale;
      }

      this._local.pendingScale = scale + 1;
      this.saveScale();
    };
  },

  scaleDown() {
    return () => {
      let scale;

      if ( this.scales.global ) {
        return;
      }

      if ( this.this._local.scaleTimer ) {
        scale = this._local.pendingScale;
      } else {
        scale = this.spec.scale;
      }

      this._local.pendingScale = Math.max(scale - 1, 0);
      this.saveScale();
    };
  },

  saveScale() {
    return () => {
      if ( this._local.scaleTimer ) {
        clearTimeout(this._local.scaleTimer);
      }

      this._local.scaleTimer = setTimeout(async() => {
        try {
          await this.patch({
            op:    'replace',
            path:  '/spec/scale',
            value: this._local.pendingScale
          });
        } catch (err) {
          this.$dispatch('growl/fromError', { title: 'Error updating scale', err }, { root: true });
        }

        this._local.scaleTimer = null;
        this._local.pendingScale = null;
      }, 500);
    };
  },

  weights() {
    let current = 0;
    let desired = 0;
    const spec = this.spec.weight;

    if ( !this.status ) {
      return { current, desired };
    }

    const status = this.status.computedWeight;

    if ( typeof status === 'number' ) {
      current = status;
    } else if ( typeof spec === 'number' ) {
      current = spec;
    }

    if ( typeof spec === 'number' ) {
      desired = spec;
    } else if ( typeof status === 'number' ) {
      desired = status;
    }

    return { current, desired };
  },

  async pauseOrResume(pause = true) {
    try {
      await this.patch({
        op:    'replace',
        path:  '/spec/rollout/pause',
        value: pause
      });
    } catch (err) {
      this.$dispatch('growl/fromError', { title: 'Error updating pause', err }, { root: true });
    }
  },

  pause() {
    return this.pauseOrResume(true);
  },

  resume() {
    return this.pauseOrResume(false);
  },

  availableActions() {
    const links = this.links || {};
    const out = this._availableActions;

    insertAt(out, 1, {
      action:  'addSidecar',
      label:   'Add a Sidecar',
      icon:    'icon icon-circle-plus',
      enabled:  !!links.update,
    });

    let isPaused = false;

    if ( this.spec.rollout && this.spec.rollout.pause ) {
      isPaused = true;
    }

    insertAt(out, 1, {
      action:  'pause',
      label:   'Pause Rollout',
      icon:    'icon icon-pause',
      enabled:  !!links.update && !isPaused,
    });

    insertAt(out, 1, {
      action:  'resume',
      label:   'Resume Rollout',
      icon:    'icon icon-circle-play',
      enabled:  !!links.update && isPaused,
    });

    return out;
  },

  addSidecar() {
    return () => {
      return this.goToEdit({ [ADD_SIDECAR]: _FLAGGED });
    };
  },
};
