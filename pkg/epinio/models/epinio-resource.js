import Resource from '@shell/plugins/dashboard-store/resource-class';
import { createEpinioRoute } from '../utils/custom-routing';
import { epinioExceptionToErrorsArray } from '../utils/errors';

export const buildBulkLink = (arr, type) => {
  return Object
    .keys(arr)
    .reduce((acc, cur) => {
      type === 'applications' ? acc[cur] = arr[cur].map(_e => `applications[]=${ _e }`).join('&') : acc[cur] = arr[cur].map(_e => `${ type }[]=${ _e }`).join('&');

      return acc;
    }, {});
};

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

  async bulkRemove(items, opt = {}) {
    // If the resource is not an application, service or configuration, move to parallel remove.
    if (!['applications', 'services', 'configurations'].includes(this.type)) {
      return await Promise.all(items.map(resource => resource.remove()));
    }

    if ( !opt.url ) {
      opt.url = (this.links || {})['self'].replace(/\/[^\/]+$/, '?');
    }
    opt.method = 'delete';
    opt.data = JSON.stringify({ unbind: false });

    // Separates the resources by namespace
    const _byNamespace = items.reduce((acc, cur) => {
      const { namespace, name } = cur.meta;

      if (!acc[namespace]) {
        acc[namespace] = [];
      }

      acc[namespace].push(name);

      return acc;
    }, {});

    const resPerNS = buildBulkLink(_byNamespace, this.type);

    // Call the bulk remove for each namespace
    await Promise.all(Object.entries(resPerNS).map(async([key, value]) => {
      opt.url = `${ opt.url?.replace(/\/([^\/]*)\/([^\/]*)\/([^\/]*)\/([^\/]*)/, `/$1/$2/$3/${ key }`) }${ value }`;

      this.$dispatch('remove', this);

      await this.$dispatch('request', { opt, type: this.type });
      console.log('### Resource Bulk Remove', this.type, items?.map(ele => ele?.id), opt); // eslint-disable-line no-console
    }));
  }
}
