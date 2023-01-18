import Resource from '@shell/plugins/dashboard-store/resource-class';
import { createEpinioRoute } from '../utils/custom-routing';
import { epinioExceptionToErrorsArray } from '../utils/errors';

export default class EpinioResource extends Resource {
  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || createEpinioRoute(`c-cluster-resource`, {
      cluster:  this.$rootGetters['clusterId'],
      resource: this.type,
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
    await this.bulkRemove();
    // if ( !opt.url ) {
    //   opt.url = (this.links || {})['self'];
    // }

    // opt.method = 'delete';

    // try {
    //   const res = await this.$dispatch('request', { opt, type: this.type });

    //   console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console
    //   this.$dispatch('remove', this);
    // } catch (e) {
    //   throw epinioExceptionToErrorsArray(e);
    // }
  }

  async bulkRemove(apps, opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})['bulkRemove'];
    }

    // TODO: We might have to filter to namespaces and have a request per namespace
    // console.log('🚀 ~ file: epinio-resource.js:65 ~ EpinioResource ~ bulkRemove ~ this.links', opt.url);

    const appsToDelete = apps.map(app => `applications=${ app.metadata.name }`).join('&');

    // console.log('🚀 ~ file: epinio-resource.js:63 ~ EpinioResource ~ bulkRemove ~ apps', apps);
    // console.log('🚀 ~ file: epinio-resource.js:69 ~ EpinioResource ~ bulkRemove ~ appsToDelete', appsToDelete);

    opt.url = `${ opt.url }${ appsToDelete }`;

    console.log('🚀 ~ file: epinio-resource.js:74 ~ EpinioResource ~ bulkRemove ~ _url', _url);
    opt.method = 'delete';

    const res = await this.$dispatch('request', { opt, type: this.type });

    console.log('🚀 ~ file: epinio-resource.js:82 ~ EpinioResource ~ bulkRemove ~ res', res);

    console.log('### Resource Bulk Remove', this.type, this.id, opt);// eslint-disable-line no-console
  }
}
