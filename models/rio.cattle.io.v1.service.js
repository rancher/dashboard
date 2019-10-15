import { insertAt } from '@/utils/array';
import { ADD_SIDECAR, _FLAGGED } from '@/config/query-params';

export default {
  appKey() {
    return `${ this.spec.namespace }/${ this.appName }`;
  },

  appName() {
    return this.spec.app || this.metadata.name;
  },

  versionName() {
    return this.spec.version || 'v0';
  },

  nameDisplay() {
    return `${ this.appName }:${ this.versionName }`;
  },

  imageDisplay() {
    return (this.spec.image || '')
      .replace(/^index.docker.io\//i, '')
      .replace(/@sha256:[0-9a-f]+$/i, '')
      .replace(/:latest$/i, '')
      .replace(/localhost:5442\/(.*)/i, '$1 (local)');
  },

  scales() {
    const status = this.status || {};
    let scaleStatus = status.scaleStatus;
    let hasStatus = true;

    if ( !scaleStatus ) {
      hasStatus = false;
      scaleStatus = {};
    }

    const spec = (typeof this.spec.scale === 'undefined' ? 1 : this.spec.scale || 0);

    // @TODO use only new fields after API changes
    const global = (this.spec.global || (this.systemSpec && this.systemSpec.global)) === true;
    const current = status.computedScale || scaleStatus.ready || 0;
    const available = (scaleStatus.available || scaleStatus.ready || 0);
    const unavailable = scaleStatus.unavailable || 0;

    let desired = this._local.pendingScale >= 0 ? this._local.pendingScale : spec;

    if ( global ) {
      desired = current;
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

  availableActions() {
    const links = this.links || {};
    const out = this._availableActions;

    insertAt(out, 1, {
      action:  'addSidecar',
      label:   'Add a Sidecar',
      icon:    'icon icon-circle-plus',
      enabled:  !!links.update,
    });

    return out;
  },

  addSidecar() {
    return () => {
      return this.goToEdit({ [ADD_SIDECAR]: _FLAGGED });
    };
  },

  // @TODO fake
  /*
  pods() {
    const out = [];
    const status = this.status.scaleStatus;

    if ( !status ) {
      return out;
    }

    let idx = 1;

    for ( let i = 0 ; i < status.ready ; i++ ) {
      let state = 'active';
      let transitioning = 'no';

      if ( i >= this.spec.scale ) {
        state = 'removing';
        transitioning = 'yes';
      }

      out.push(store.createRecord({
        type:           'pod',
        name:           `${ this.nameDisplay }-${ idx }`,
        state,
        transitioning,

        containers: [
          store.createRecord({
            type:          'container',
            name:          `container${ idx }`,
            state,
            transitioning,
          })
        ]
      }));

      idx++;
    }

    for ( let i = 0 ; i < status.available ; i++ ) {
      out.push(store.createRecord({
        type:           'pod',
        name:           `${ get(this, 'nameDisplay') }-${ idx }`,
        state:          'not-ready',
        transitioning:  'no',

        containers: [
          store.createRecord({
            type:          'container',
            name:          `container${ idx }`,
            state:         'not-ready',
            transitioning: 'no',
          })
        ]
      }));

      idx++;
    }

    for ( let i = 0 ; i < status.unavailable ; i++ ) {
      out.push(store.createRecord({
        type:          'pod',
        name:          `${ get(this, 'nameDisplay') }-${ idx }`,
        state:         'creating',
        transitioning: 'yes',

        containers: [
          store.createRecord({
            type:          'container',
            name:          `container${ idx }`,
            state:         'transitioning',
            transitioning: 'yes',
          })
        ]
      }));

      idx++;
    }

    return out;
  },

  partiallyUpdated: computed('scale', 'scaleStatus.updated', function() {
    let scale = get(this, 'scale');
    let status = get(this, 'scaleStatus');

    if ( !status ) {
      return false;
    }

    if ( scale > 0 && status.updated > 0 && scale > status.updated ) {
      return true;
    }

    return false;
  }),

  updatedPercent: computed('scale', 'scaleStatus.updated', function() {
    let scale = get(this, 'scale');
    let status = get(this, 'scaleStatus');

    return formatPercent(100 * status.updated / scale);
  }),
  */
};
