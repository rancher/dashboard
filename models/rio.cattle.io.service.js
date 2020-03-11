import day from 'dayjs';
import { insertAt, filterBy } from '@/utils/array';
import {
  ADD_SIDECAR, _FLAGGED, MODE, _CREATE, _CLONE, _STAGE
} from '@/config/query-params';
import { escapeHtml } from '@/utils/string';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { addParams } from '@/utils/url';
import { PRIVATE } from '@/plugins/steve/resource-proxy';
import { RIO } from '@/config/types';
import { formatSi } from '@/utils/units';
import { get } from '@/utils/object';

const EMPTY = {};

export default {
  applyDefaults(ctx, mode) {
    const spec = this.spec;

    if ( mode === _CREATE || mode === _CLONE ) {
      delete spec.app;
      spec.version = 'v0';
    } else if ( mode === _STAGE ) {
      spec.app = this.app;
      delete spec.version;
    }

    if ( mode === _CREATE ) {
      spec.weight = 10000;
    } else if ( mode === _CLONE ) {
      delete spec.weight;
    } else if ( mode === _STAGE ) {
      spec.weight = 0;
    }
  },

  app() {
    const spec = this.spec || EMPTY;
    const status = this.status || EMPTY;
    const metadata = this.metadata || EMPTY;

    return spec.app || status.computedApp || metadata.name;
  },

  version() {
    const spec = this.spec || EMPTY;
    const status = this.status || EMPTY;
    const uid = ((this.metadata || EMPTY)['uid'] || '').replace(/-.*$/, '');

    return spec.version || status.computedVersion || uid || '?';
  },

  nameDisplay() {
    const version = this.version;

    if ( version === 'v0' ) {
      return this.app;
    }

    return `${ this.app }@${ this.version }`;
  },

  namespaceApp() {
    return `${ this.metadata.namespace }:${ this.app }`;
  },

  imageDisplay() {
    if ( this.spec.build && !this.spec.image ) {
      return 'Building from Git...';
    }

    return (this.spec.image || '')
      .replace(/^(index\.)?docker.io\/(library\/)?/i, '')
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
    const scaleStatus = status.scaleStatus || {};
    const auto = !!this.spec.autoscale;
    const fixed = (typeof this.spec.replicas === 'undefined' ? 1 : this.spec.replicas || 0);
    const available = scaleStatus.available || 0;
    const current = (typeof status.computedReplicas === 'undefined' ? available : status.computedReplicas || 0);
    const unavailable = scaleStatus.unavailable || 0;
    const global = this.spec.global === true;

    let desired = fixed;
    let min, max;

    if ( auto ) {
      min = this.spec.autoscale.minReplicas;
      max = this.spec.autoscale.maxReplicas;
      desired = `${ min } - ${ max }`;
    }

    if ( global ) {
      desired = current;
    } else if ( typeof this[PRIVATE].pendingScale === 'number' ) {
      desired = this[PRIVATE].pendingScale;
    }

    const missing = Math.max(0, desired - available - unavailable);

    return {
      global,
      auto,
      min,
      max,
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

      if ( this[PRIVATE].scaleTimer ) {
        scale = this[PRIVATE].pendingScale;
      } else {
        scale = this.scales.desired;
      }

      scale = scale || 0;

      this[PRIVATE].pendingScale = scale + 1;
      this.saveScale();
    };
  },

  scaleDown() {
    return () => {
      let scale;

      if ( this.scales.global ) {
        return;
      }

      if ( this[PRIVATE].scaleTimer ) {
        scale = this[PRIVATE].pendingScale;
      } else {
        scale = this.scales.desired;
      }

      scale = scale || 1;

      this[PRIVATE].pendingScale = Math.max(scale - 1, 0);
      this.saveScale();
    };
  },

  saveScale() {
    return () => {
      if ( this[PRIVATE].scaleTimer ) {
        clearTimeout(this[PRIVATE].scaleTimer);
      }

      this[PRIVATE].scaleTimer = setTimeout(async() => {
        try {
          await this.patch([{
            op:    'replace',
            path:  '/spec/replicas',
            value: this[PRIVATE].pendingScale
          }]);
        } catch (err) {
          this.$dispatch('growl/fromError', { title: 'Error updating scale', err }, { root: true });
        }

        this[PRIVATE].scaleTimer = null;
        this[PRIVATE].pendingScale = null;
      }, 500);
    };
  },

  allVersions() {
    const services = this.$getters['all'](RIO.SERVICE);

    const out = filterBy(services, {
      app:                  this.app,
      'metadata.namespace': this.metadata.namespace,
    });

    return out;
  },

  weightsOfApp() {
    let desired = 0;
    let current = 0;
    let count = 0;

    for ( const service of this.allVersions ) {
      const weights = service.weights;

      desired += weights.desired || 0;
      current += weights.current || 0;
      count++;
    }

    return {
      desired,
      current,
      count
    };
  },

  weights() {
    let current = 0;
    let desired = 0;

    const fromSpec = this.spec.weight;

    if ( this.status ) {
      const fromStatus = this.status.computedWeight;

      if ( typeof fromStatus === 'number' ) {
        current = fromStatus;
      } else if ( typeof fromSpec === 'number' ) {
        current = fromSpec;
      }

      if ( typeof fromSpec === 'number' ) {
        desired = fromSpec;
      } else if ( typeof fromStatus === 'number' ) {
        desired = fromStatus;
      }
    }

    return { current, desired };
  },

  weightsPercent() {
    const self = this.weights;
    const app = this.weightsOfApp;

    let desired = 0;
    let current = 0;

    if ( self.desired && app.desired ) {
      desired = self.desired / app.desired * 100;
    }

    if ( self.current && app.current ) {
      current = self.current / app.current * 100;
    }

    return { current, desired };
  },

  saveWeightPercent() {
    return (newPercent) => {
      const appInfo = this.weightsOfApp;
      const totalWeight = appInfo.desired;
      const currentPercent = (totalWeight === 0 ? 0 : this.weights.desired / totalWeight);
      const currentWeight = this.spec.weight || 0;
      const totalOfOthers = totalWeight - currentWeight;
      const count = appInfo.count;

      if ( currentPercent === 100 ) {
        if ( newPercent === 100 ) {
          return;
        } else if ( newPercent === 0 ) {
          return this.saveWeight(0);
        }

        const weight = newWeight(100 - newPercent) / (count - 1);

        for ( const svc of this.allVersions ) {
          if ( svc.id === this.id ) {
            continue;
          }

          svc.saveWeight(weight);
        }
      } else if ( totalOfOthers === 0 || newPercent === 100 ) {
        this.saveWeight(10000);

        for ( const svc of this.allVersions ) {
          if ( svc.id === this.id ) {
            continue;
          }

          svc.saveWeight(0);
        }
      } else {
        const weight = newWeight(newPercent);

        this.saveWeight(weight);
      }

      function newWeight(percent) {
        if ( percent === 0 ) {
          return 0;
        }

        const out = Math.round(totalOfOthers / (1 - (percent / 100))) - totalOfOthers;

        return out;
      }
    };
  },

  saveWeight() {
    return async(neu) => {
      console.log('Save Weight', this.spec.app, this.spec.version, neu);
      try {
        await this.patch([{
          op:    'replace',
          path:  '/spec/weight',
          value: neu
        }]);
      } catch (err) {
        this.$dispatch('growl/fromError', { title: 'Error updating weight', err }, { root: true });
      }
    };
  },

  pauseOrResume() {
    return async(pause = true) => {
      try {
        await this.patch([{
          op:    'replace',
          path:  '/spec/rollout/pause',
          value: pause
        }]);
      } catch (err) {
        this.$dispatch('growl/fromError', { title: 'Error updating pause', err }, { root: true });
      }
    };
  },

  pause() {
    this.pauseOrResume(true);
  },

  resume() {
    this.pauseOrResume(false);
  },

  goToStage() {
    const router = this.currentRouter();

    return (moreQuery = {}) => {
      const url = addParams(this.detailUrl, {
        [MODE]:  _STAGE,
        ...moreQuery
      });

      router.push({ path: url });
    };
  },

  _availableActions() {
    const links = this.links || {};
    const out = this._standardActions;

    let isPaused = false;

    if ( this.spec.rollout && this.spec.rollout.pause ) {
      isPaused = true;
    }

    insertAt(out, 2, {
      action:  'pause',
      label:   'Pause Rollout',
      icon:    'icon icon-gear',
      enabled:  !!links.update && !isPaused,
    });

    insertAt(out, 2, {
      action:  'resume',
      label:   'Resume Rollout',
      icon:    'icon icon-gear',
      enabled:  !!links.update && isPaused,
    });

    insertAt(out, 2, {
      action:  'addSidecar',
      label:   'Add a Sidecar',
      icon:    'icon icon-circle-plus',
      enabled:  !!links.update,
    });

    insertAt(out, 2, {
      action:  'goToStage',
      label:   'Stage New Version',
      icon:    'icon icon-copy',
      enabled:  !!links.update,
    });

    insertAt(out, 2, { divider: true });

    return out;
  },

  addSidecar() {
    return () => {
      return this.goToEdit({ [ADD_SIDECAR]: _FLAGGED });
    };
  },

  networkBytes() {
    const read = get(this, 'metadata.computed.fields.readBytesPerSecond') || 0;
    const write = get(this, 'metadata.computed.fields.writeBytesPerSecond') || 0;

    return read + write;
  },

  networkDisplay() {
    return formatSi(this.networkBytes, { suffix: 'Bps' });
  },

  p95() {
    const out = get(this, 'metadata.computed.fields.p95') || 0;

    return out;
  },

  p95Display() {
    return `${ this.p95 }ms`;
  },

  connections() {
    const out = get(this, 'metadata.computed.fields.openConnections') || 0;

    return out;
  },
};
