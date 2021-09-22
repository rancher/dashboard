import { EPINIO_TYPES } from '@/plugins/app-extension/epinio/types';
import { createEpinioRoute } from '@/plugins/app-extension/epinio/utils/custom-routing';
import { isEmpty } from '@/utils/object';
import EpinioResource from './epinio-resource-instance.class';

export default class EpinioApplication extends EpinioResource {
  get orgLocation() {
    // return this.$getters['byId'](EPINIO_TYPES.ORG, this.organization).
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.ORG,
      id:       this.organization
    });
  }

  get links() {
    // TODO: RC API v1/apps available?
    return {
      update: `/proxy/api/v1/orgs/${ this.organization }/applications/${ this.id }`,
      self:   `/proxy/api/v1/orgs/${ this.organization }/applications/${ this.id }`,
      remove: `/proxy/api/v1/orgs/${ this.organization }/applications/${ this.id }`
    };
  }

  // ------------------------------------------------------------------

  get canClone() {
    return false;
  }

  get canViewInApi() {
    return false;
  }

  // ------------------------------------------------------------------

  async _save(opt = {}) {
    delete this.__rehydrate;
    const forNew = !this.id;

    const errors = await this.validationErrors(this, opt.ignoreFields);

    if (!isEmpty(errors)) {
      return Promise.reject(errors);
    }

    if ( !opt.url ) {
      const schema = this.$getters['schemaFor'](this.type);

      if ( forNew ) {
        // const schema = this.$getters['schemaFor'](this.type);
        // let url = schema.linkFor('collection');

        // if ( schema.attributes && schema.attributes.namespaced && this.metadata && this.metadata.namespace ) {
        //   url += `/${ this.metadata.namespace }`;
        // }

        opt.url = schema.linkFor('collection');
      } else {
        opt.url = this.linkFor('update') || this.linkFor('self');
      }
    }

    if ( !opt.method ) {
      opt.method = ( forNew ? 'post' : 'patch' );
    }

    if ( !opt.headers ) {
      opt.headers = {};
    }

    if ( !opt.headers['content-type'] ) {
      opt.headers['content-type'] = ( forNew ? 'application/json' : 'application/json-patch+json' );
    }

    if ( !opt.headers['accept'] ) {
      opt.headers['accept'] = 'application/json';
    }

    opt.data = { ...this };

    try {
      const res = await this.$dispatch('request', { opt, type: this.type });

      console.log('### Resource Save', this.type, this.id, res);// eslint-disable-line no-console

      // TODO: RC HANDLE
      // Steve sometimes returns Table responses instead of the resource you just saved.. ignore
      // if ( res && res.kind !== 'Table') {
      //   await this.$dispatch('load', { data: res, existing: (forNew ? this : undefined ) });
      // }
    } catch (e) {
      if ( this.type && this.id && e?._status === 409) {
        // If there's a conflict, try to load the new version
        await this.$dispatch('find', {
          type: this.type,
          id:   this.id,
          opt:  { force: true }
        });
      }

      return Promise.reject(e);
    }

    return this;
  }

  async remove(opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})['self'];
    }

    opt.method = 'delete';

    const res = await this.$dispatch('request', { opt, type: this.type });

    console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console
    // if ( res?._status === 204 ) {
    //   // If there's no body, assume the resource was immediately deleted
    //   // and drop it from the store as if a remove event happened.
    //   await this.$dispatch('ws.resource.remove', { data: this });
    // }
  }
}
