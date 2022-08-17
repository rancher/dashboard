import { createEpinioRoute } from '../utils/custom-routing';
import Resource from '@shell/plugins/dashboard-store/resource-class';
import { epinioExceptionToErrorsArray } from '../utils/errors';

export default class EpinioResource extends Resource {
  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || createEpinioRoute(`c-cluster-resource`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.type,
    });
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get doneRoute() {
    return this.listLocation.name;
  }

  // ------------------------------------------------------------------

  get canClone() {
    return false;
  }

  get canYaml() {
    return false;
  }

  get canViewInApi() {
    return false;
  }

  // ------------------------------------------------------------------
  async _save(opt = {}) {
    try {
      return await super._save(opt);
    } catch (e) {
      throw epinioExceptionToErrorsArray(e);
    }
  }

  async remove(opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})['self'];
    }

    opt.method = 'delete';

    try {
      if (this.type === 'namespaces') {
        await this._closeLogsOnDelete(this.id);
      }

      const res = await this.$dispatch('request', { opt, type: this.type });

      console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console
      this.$dispatch('remove', this);
    } catch (e) {
      throw epinioExceptionToErrorsArray(e);
    }
  }

  // Close APPS logs on namespace deletions
  async _closeLogsOnDelete(namespace) {
    try {
      const namespaces = await this.$dispatch('findAll', { type: this.type, opt: { force: true } });

      // Find new namespace
      const current = namespaces.filter(n => n.id === namespace)[0];

      if (current.apps && current.apps.length) {
        const allTabs = await this.$rootGetters['wm/allTabs'];

        current.apps.map((e) => {
          const appShellId = `epinio-${ namespace }/${ e }-app-shell`;
          const appLogId = `epinio-${ namespace }/${ e }-app-logs`;

          if ( allTabs.length > 0 ) {
            allTabs.map((el) => {
              const stagingLog = `epinio-${ namespace }/${ e }-logs-`;

              if (el.id.startsWith(stagingLog)) {
                this.$dispatch('wm/close', el.id, { root: true });
              }
            });
          }

          this.$dispatch('wm/close', appLogId, { root: true });
          this.$dispatch('wm/close', appShellId, { root: true });
        });
      }
    } catch (e) {
      throw epinioExceptionToErrorsArray(e);
    }
  }
}
