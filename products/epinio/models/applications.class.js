import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import EpinioResource from './epinio-resource-instance.class';

export default class EpinioApplication extends EpinioResource {
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
        action:     'showAppLog',
        label:      'View Logs', // TODO: RC tidy after screenshots
        icon:       'icon icon-fw icon-chevron-right',
        enabled:    this.active,
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
      logs:   `${ this.getUrl() }/logs`,
    };
  }

  getUrl(namespace = this.namespace, name = this.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `api/v1/namespaces/${ namespace }/applications/${ name || '' }` });
  }

  // ------------------------------------------------------------------
  // Methods here are required for generic components to handle `namespaced` concept

  set metadata(metadata) {
    this.namespace = metadata.namespace;
    this.name = metadata.name;
  }

  get metadata() {
    return {
      namespace: this.namespace,
      name:      this.name
    };
  }

  get namespaceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.NAMESPACE,
      id:       this.metadata.namespace,
    });
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

  async stage(blobuid, builderImage) {
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
        builderimage: builderImage
      }
    });
  }

  showAppLog() {
    this.$dispatch('wm/open', {
      id:        `epinio-${ this.id }-logs`,
      label:     this.name,
      product:   EPINIO_PRODUCT_NAME,
      icon:      'file',
      component: 'ApplicationLogs',
      attrs:     { application: this }
    }, { root: true });
  }

  showStagingLog(stageId) {
    this.$dispatch('wm/open', {
      id:        `epinio-${ this.id }-logs`,
      label:     `${ this.name } - Staging - ${ stageId }`,
      product:   EPINIO_PRODUCT_NAME,
      icon:      'file',
      component: 'StagingLogs',
      attrs:     { application: this }
    }, { root: true });
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
