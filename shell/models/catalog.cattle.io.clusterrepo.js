import Vue from 'vue';
import { parse } from '@shell/utils/url';
import { CATALOG } from '@shell/config/labels-annotations';
import { insertAt } from '@shell/utils/array';
import { CATALOG as CATALOG_TYPE } from '@shell/config/types';

import SteveModel from '@shell/plugins/steve/steve-class';

export default class ClusterRepo extends SteveModel {
  applyDefaults() {
    if ( !this.spec ) {
      Vue.set(this, 'spec', { url: '' });
    }
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, { divider: true });

    insertAt(out, 0, {
      action:   'refresh',
      label:    this.t('action.refresh'),
      icon:     'icon icon-refresh',
      enabled:  !!this.links.update,
      bulkable: true,
    });

    return out;
  }

  refresh() {
    const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

    this.spec.forceUpdate = now;
    this.save();
  }

  get isGit() {
    return !!this.spec?.gitRepo;
  }

  get isRancherSource() {
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
  }

  get isRancher() {
    return this.isRancherSource && this.metadata.name === 'rancher-charts';
  }

  get isPartner() {
    return this.isRancherSource && this.metadata.name === 'rancher-partner-charts';
  }

  get color() {
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
  }

  get canLoad() {
    return this.metadata?.state?.name === 'active';
  }

  get typeDisplay() {
    if ( this.spec.gitRepo ) {
      return 'git';
    } else if ( this.spec.url ) {
      return 'http';
    } else {
      return '?';
    }
  }

  get nameDisplay() {
    const name = this.metadata?.name;
    const key = `catalog.repo.name."${ name }"`;

    return this.$rootGetters['i18n/withFallback'](key, null, name);
  }

  get urlDisplay() {
    return this.status?.url || this.spec.gitRepo || this.spec.url;
  }

  get branchDisplay() {
    return this.spec?.gitBranch || '(default)';
  }

  get details() {
    return [
      {
        label:   'Type',
        content: this.typeDisplay,
      },
      {
        label:         'Downloaded',
        content:       this.status.downloadTime,
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
      },
    ];
  }

  get stateObj() {
    return this.metadata?.state ? {
      ...this.metadata.state,
      transitioning: this.metadata.generation > this.status?.observedGeneration ? false : this.metadata.state.transitioning
    } : undefined;
  }

  waitForOperation(operationId, timeout, interval = 2000) {
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
  }
}
