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

  async forceFetch() {
    await this.$dispatch('find', {
      type: this.type,
      id:   `${ this.meta.namespace }/${ this.meta.name }`,
      opt:  { force: true }
    });
  }

  get detailLocation() {
    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return createEpinioRoute(`c-cluster-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  this.type,
      id,
      namespace: this.meta?.namespace,
    });
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
      const res = await this.$dispatch('request', { opt, type: this.type });

      console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console
      this.$dispatch('remove', this);
    } catch (e) {
      throw epinioExceptionToErrorsArray(e);
    }
  }
}
