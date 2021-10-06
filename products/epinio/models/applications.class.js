import { EPINIO_TYPES } from '@/products/epinio/types';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import EpinioResource from './epinio-resource-instance.class';

export default class EpinioApplication extends EpinioResource {
  get id() {
    return `${ this.name }`;
    // return `${ this.namespace }-${ this.name }`; // TODO: RC id needs to contain the namespace... however this will break fetch/get by id
  }

  get state() {
    return this.active ? '' : 'in-progress';
  }

  get stateObj() {
    return this.active ? {} : {
      transitioning: true,
      message:       this.status
    };
  }

  get _availableActions() {
    return [
      {
        action:     '', // TODO: RC tidy after screenshots
        label:      'Show Logs', // TODO: RC tidy after screenshots
        icon:       'icon icon-fw icon-chevron-right',
        enabled:    true, // TODO: RC tidy after screenshots
      },
      { divider: true },
      ...this._standardActions
    ];
  }

  get routeLocation() {
    // TODO: RC tidy after screenshots
    return { url: this.route ? `https://${ this.route }` : '' };
  }

  get nsLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.NAMESPACE,
      id:       this.namespace
    });
  }

  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
      remove: this.getUrl(),
      create: this.getUrl(this.namespace, null),
      store:  `${ this.getUrl() }/store`,
      stage:  `${ this.getUrl() }/stage`,
      deploy:  `${ this.getUrl() }/deploy`,
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

  getUrl(namespace = this.namespace, name = this.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ namespace }/applications/${ name || '' }` });
  }

  // ------------------------------------------------------------------

  trace(text, ...args) {
    console.log(`### Application: ${ text }`, this.id, args);// eslint-disable-line no-console
  }

  async create() {
    this.trace('Create the application resource');

    await this.followLink('create', {
      method:  'post',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: {
        name:          this.name,
        configuration: {
          instances:   1,
          services:    [],
          environment: []
        }
      }
    });
  }

  async storeArchive(data) {
    this.trace('Storing Application archive');

    const formData = new FormData();

    formData.append('file', data);

    const res = await this.followLink('store', {
      method:         'post',
      headers: {
        'content-type': 'multipart/form-data',
        'File-Size':    data.size,
      },
      data: formData
    });

    return res.blobuid;
  }

  async stage(blobuid) {
    this.trace('Staging Application bits');

    return await this.followLink('stage', {
      method:  'post',
      headers: { 'content-type': 'application/json' },
      data:    {
        app: {
          name:      this.name,
          namespace: this.namespace
        },
        blobuid,
        builderimage: 'paketobuildpacks/builder:full'
      }
    });
  }

  showAppLog(Id) {
    // https://github.com/epinio/epinio/blob/6ef5cc0044f71c01cf90ed83bcdda18251c594a7/internal/cli/usercmd/client.go
  }

  showStagingLog(stageId) {
    // https://github.com/epinio/epinio/blob/6ef5cc0044f71c01cf90ed83bcdda18251c594a7/internal/cli/usercmd/client.go
  }

  async waitForStaging(stageId) {
    this.trace('Waiting for Application bits to be staged');

    const opt = {
      url:     this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ this.namespace }/staging/${ stageId }/complete` }),
      method:         'get',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
    };

    await this.$dispatch('request', { opt, type: this.type });
    // TODO: RC API assume any acceptable response is 'ok' ({ status: ok })
  }

  async deploy(stageId, image) {
    this.trace('Deploying Application bits');

    const res = await this.followLink('deploy', {
      method:         'post',
      headers: { 'content-type': 'application/json' },
      data:    {
        app: {
          name:      this.name,
          namespace: this.namespace
        },
        stage: { id: stageId },
        image
      }
    });

    this.route = res.route;
  }

  async remove(opt = {}) {
    if ( !opt.url ) {
      opt.url = (this.links || {})['self'];
    }

    opt.method = 'delete';

    const res = await this.$dispatch('request', { opt, type: this.type });

    console.log('### Resource Remove', this.type, this.id, res);// eslint-disable-line no-console

    this.$dispatch('remove', this);
    // if ( res?._status === 204 ) {
    //   // If there's no body, assume the resource was immediately deleted
    //   // and drop it from the store as if a remove event happened.
    //   await this.$dispatch('ws.resource.remove', { data: this });
    // }
  }
}
