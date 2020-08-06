import Vue from 'vue';
import { _FLAGGED, _VIEW } from '@/config/query-params';

export default {
  showMasthead(mode) {
    return mode === _VIEW;
  },

  applyDefaults() {
    return () => {
      Vue.set(this, 'disableOpenApiValidation', false);
      Vue.set(this, 'noHooks', false);
      Vue.set(this, 'skipCRDs', false);
      Vue.set(this, 'timeout', 300);
      Vue.set(this, 'wait', true);
    };
  },

  availableActions() {
    const out = this._standardActions;

    const upgrade = {
      action:     'goToUpgrade',
      enabled:    true,
      icon:       'icon icon-fw icon-edit',
      label:      'Upgrade',
    };

    out.unshift(upgrade);

    return out;
  },

  goToUpgrade() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        upgrade: _FLAGGED,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  details() {
    const t = this.$rootGetters['i18n/t'];

    return [
      {
        label:     t('model."catalog.cattle.io.release".firstDeployed'),
        formatter: 'LiveDate',
        content:   this.spec?.info?.firstDeployed
      },
      {
        label:     t('model."catalog.cattle.io.release".lastDeployed'),
        formatter: 'LiveDate',
        content:   this.spec?.info?.lastDeployed
      },
    ];
  },

  nameDisplay() {
    let out = this.spec?.name || this.metadata?.name || this.id || '';

    const version = this.spec?.version;

    if ( version && version !== 1 ) {
      out += `:v${ version }`;
    }

    return out;
  },

  chartDisplay() {
    const meta = this.spec?.chart?.metadata;

    if ( meta ) {
      return `${ meta.name }:${ meta.version.startsWith('v') ? '' : 'v' }${ meta.version }`;
    } else {
      return '?';
    }
  },

  // upgrade() {
  //   return () => {
  //     debugger;
  //   };
  // },

  remove() {
    return (opt = {}) => {
      return this.doAction('uninstall', opt);
    };
  },
};
