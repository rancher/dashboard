
export default {
  displayImage() {
    return (this.spec.image || '')
      .replace(/^index.docker.io\//i, '')
      .replace(/@sha256:[0-9a-f]+$/i, '')
      .replace(/:latest$/i, '');
  },

  scales() {
    let status = this.status.scaleStatus;
    let hasStatus;

    if ( status ) {
      hasStatus = true;
    } else {
      hasStatus = false;
      status = {};
    }

    return {
      hasStatus,
      pending:     this._local.pendingScale || null,
      current:     this.spec.scale || 0,
      desired:     this._local.pendingScale >= 0 ? this._local.pendingScale : this.spec.scale,
      available:   status.available || 0,
      unavailable: status.unavailable || 0,
      ready:       status.ready || 0,
    };
  },

  showReadyScale() {
    return this.scales.ready !== this.scales.desired;
  },

  complexScale() {
    const {
      available, unavailable, ready, current
    } = this.scales;

    if ( available === 0 && unavailable === 0 && ready >= current ) {
      return false;
    }

    return true;
  },

  scaleParts() {
    const {
      ready, available, unavailable, current
    } = this.scales;
    const pending = Math.max(0, current - ready - available - unavailable);

    const out = [
      {
        label:     'Ready',
        color:     'bg-success',
        textColor: 'text-success',
        value:      ready
      },

      {
        label:     'Available',
        color:     'bg-info',
        textColor: 'text-info',
        value:      available
      },

      {
        label:     'Unavailable',
        color:     'bg-warning',
        textColor: 'text-warning',
        value:     unavailable
      },

      {
        label:     'Pending',
        color:     'bg-error',
        textColor: 'text-error',
        value:     pending
      },
    ];

    return out;
  },

  scaleUp() {
    return () => {
      let scale;

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
        name:           `${ this.displayName }-${ idx }`,
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
        name:           `${ get(this, 'displayName') }-${ idx }`,
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
        name:          `${ get(this, 'displayName') }-${ idx }`,
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
