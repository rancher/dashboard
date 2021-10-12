import Vue from 'vue';
import { parse } from '@/utils/url';
import { CATALOG } from '@/config/labels-annotations';
import { insertAt } from '@/utils/array';
import { CATALOG as CATALOG_TYPE } from '@/config/types';

export default {
  applyDefaults() {
    return () => {
      if ( !this.spec ) {
        Vue.set(this, 'spec', { url: '' });
      }
    };
  },

  // remove clone as yaml/edit as yaml until API supported
  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, { divider: true });

    insertAt(out, 0, {
      action:     'refresh',
      label:      this.t('action.refresh'),
      icon:       'icon icon-refresh',
      enabled:    !!this.links.update,
      bulkable:   true,
    });

    return out;
  },

  refresh() {
    return () => {
      const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

      this.spec.forceUpdate = now;
      this.save();
    };
  },

  isGit() {
    return !!this.spec?.gitRepo;
  },

  isRancherSource() {
    let parsed;

    if ( this.spec?.url && this.spec?.gitRepo ) {
      // Well that's suspicious...
      return false;
    }

    if ( this.spec?.url ) {
      parsed = parse(this.spec.url);
      if ( parsed && ok(parsed.host) ) {
        return true;
      }
    }

    if ( this.spec?.gitRepo ) {
      parsed = parse(this.spec.gitRepo);
      if ( parsed && ok(parsed.host) ) {
        return true;
      }
    }

    return false;

    function ok(host) {
      host = (host || '').toLowerCase();

      return host === 'rancher.io' || host.endsWith('.rancher.io');
    }
  },

  isRancher() {
    return this.isRancherSource && this.metadata.name === 'rancher-charts';
  },

  isPartner() {
    return this.isRancherSource && this.metadata.name === 'rancher-partner-charts';
  },

  color() {
    if ( this.isRancher ) {
      return 'rancher';
    } else if ( this.isPartner ) {
      return 'partner';
    } else {
      const color = parseInt(this.metadata?.annotations?.[CATALOG.COLOR], 10);

      if ( isNaN(color) || color <= 0 || color > 8 ) {
        return null;
      }

      return `color${ color }`;
    }
  },

  canLoad() {
    return this.metadata?.state?.name === 'active';
  },

  typeDisplay() {
    if ( this.spec.gitRepo ) {
      return 'git';
    } else if ( this.spec.url ) {
      return 'http';
    } else {
      return '?';
    }
  },

  nameDisplay() {
    const name = this.metadata?.name;
    const key = `catalog.repo.name."${ name }"`;

    return this.$rootGetters['i18n/withFallback'](key, null, name);
  },

  urlDisplay() {
    return this.status?.url || this.spec.gitRepo || this.spec.url;
  },

  branchDisplay() {
    return this.spec?.gitBranch || '(default)';
  },

  details() {
    return [
      {
        label:     'Type',
        content:   this.typeDisplay,
      },
      {
        label:         'Downloaded',
        content:       this.status.downloadTime,
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
      },
    ];
  },

  waitForOperation() {
    return (operationId, timeout, interval = 2000) => {
      return this.waitForTestFn(() => {
        if (!this.$getters['schemaFor'](CATALOG_TYPE.OPERATION)) {
          return false;
        }
        if (this.$getters['byId'](CATALOG_TYPE.OPERATION, operationId)) {
          return true;
        }
        this.$dispatch('find', {
          type: CATALOG_TYPE.OPERATION,
          id:   operationId
        });
      }, `catalog operation fetch`, timeout, interval);
    };
  },

  stateObj() {
    return this.metadata ? {
      ...this.metadata.state,
      transitioning: this.metadata.generation > this.status.observedGeneration ? false : this.metadata.state.transitioning
    } : undefined;
  }
};
