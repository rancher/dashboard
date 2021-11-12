import { EPINIO_TYPES } from '@/products/epinio/types';
import { createEpinioRoute } from '@/products/epinio/utils/custom-routing';
import EpinioResource from './epinio-resource';

// See https://github.com/epinio/epinio/blob/00684bc36780a37ab90091498e5c700337015a96/pkg/api/core/v1/models/app.go#L11
const STATES = {
  CREATING: 'created',
  STAGING:  'staging',
  RUNNING:  'running',
  ERROR:    'error'
};

// These map to @/plugins/core-store/resource-class STATES
const STATES_MAPPED = {
  [STATES.CREATING]: 'created',
  [STATES.STAGING]:  'provisioning',
  [STATES.RUNNING]:  'running',
  [STATES.ERROR]:    'error',
  unknown:           'unknown',
};

export default class EpinioApplication extends EpinioResource {
  buildCache = {};

  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || createEpinioRoute(`c-cluster-applications`, { cluster: this.$rootGetters['clusterId'] });
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get state() {
    return STATES_MAPPED[this.status] || STATES_MAPPED.unknown;
  }

  get stateObj() {
    switch (this.status) {
    case STATES.CREATING:
      return {
        error:         false,
        transitioning: false,
        message:       this.statusmessage
      };
    case STATES.STAGING:
      return {
        error:         false,
        transitioning: true,
        message:       this.statusmessage
      };
    case STATES.RUNNING:
      return {
        error:         false,
        transitioning: false,
        message:       this.statusmessage
      };
    case STATES.ERROR:
      return {
        error:         true,
        transitioning: false,
        message:       this.statusmessage
      };
    default:
      return {
        error:         true,
        transitioning: false,
        message:       this.statusmessage
      };
    }
  }

  get _availableActions() {
    return [
      // Streaming logs over socket isn't supported at the moment (requires auth changes to backend or un-CORS-ing)
      // https://github.com/epinio/ui/issues/3
      // {
      //   action:     'showAppLog',
      //   label:      this.t('epinio.applications.actions.viewAppLogs.label'),
      //   icon:       'icon icon-fw icon-chevron-right',
      //   enabled:    this.active,
      // },
      // { divider: true },
      ...super._availableActions
    ];
  }

  get nsLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.NAMESPACE,
      id:       this.meta.namespace
    });
  }

  get links() {
    return {
      update: this.getUrl(),
      self:   this.getUrl(),
      remove: this.getUrl(),
      create: this.getUrl(this.meta?.namespace, null), // ensure name is null
      store:  `${ this.getUrl() }/store`,
      stage:  `${ this.getUrl() }/stage`,
      deploy: `${ this.getUrl() }/deploy`,
      logs:   `${ this.getUrl() }/logs`,
    };
  }

  getUrl(namespace = this.meta?.namespace, name = this.meta?.name) {
    // Add baseUrl in a generic way
    return this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ namespace }/applications/${ name || '' }` });
  }

  get services() {
    const all = this.$getters['all'](EPINIO_TYPES.SERVICE);

    return (this.configuration.services || []).reduce((res, serviceName) => {
      const s = all.find(allS => allS.meta.name === serviceName);

      if (s) {
        res.push(s);
      }

      return res;
    }, []);
  }

  // ------------------------------------------------------------------
  // Methods here are required for generic components to handle `namespaced` concept

  set metadata(metadata) {
    this.meta = {
      namespace: metadata.namespace,
      name:      metadata.name,
    };
  }

  get metadata() {
    return this.meta || {};
  }

  get namespaceLocation() {
    return createEpinioRoute(`c-cluster-resource-id`, {
      cluster:   this.$rootGetters['clusterId'],
      resource:  EPINIO_TYPES.NAMESPACE,
      id:       this.meta.namespace,
    });
  }

  // ------------------------------------------------------------------

  trace(text, ...args) {
    console.log(`### Application: ${ text }`, `${ this.meta.namespace }/${ this.meta.name }`, args);// eslint-disable-line no-console
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
        name:          this.meta.name,
        configuration: {
          instances:   this.configuration.instances,
          services:    this.configuration.services,
          environment: this.configuration.environment,
        }
      }
    });
  }

  async update() {
    this.trace('Update the application resource');
    await this.followLink('update', {
      method:  'patch',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
      data: {
        instances:   this.configuration.instances,
        services:    this.configuration.services,
        environment: this.configuration.environment,
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

    this.buildCache.store = { blobUid: res.blobuid };

    return this.lastBlobUid;
  }

  async stage(blobuid, builderImage) {
    this.trace('Staging Application bits');

    const { image, stage } = await this.followLink('stage', {
      method:  'post',
      headers: { 'content-type': 'application/json' },
      data:    {
        app: {
          name:      this.meta.name,
          namespace: this.meta.namespace
        },
        blobuid,
        builderimage: builderImage
      }
    });

    this.buildCache.stage = {
      stage,
      image
    };

    return { image, stage };
  }

  showAppLog() {
    // Streaming logs over socket isn't supported at the moment (requires auth changes to backend or un-CORS-ing)
    // https://github.com/epinio/ui/issues/3
    // this.$dispatch('wm/open', {
    //   id:        `epinio-${ this.id }-logs`,
    //   label:     `${ this.meta.name }`,
    //   product:   EPINIO_PRODUCT_NAME,
    //   icon:      'file',
    //   component: 'ApplicationLogs',
    //   attrs:     { application: this }
    // }, { root: true });
  }

  showStagingLog(stageId) {
    // Streaming logs over socket isn't supported at the moment (requires auth changes to backend or un-CORS-ing)
    // https://github.com/epinio/ui/issues/3
    // this.$dispatch('wm/open', {
    //   id:        `epinio-${ this.id }-logs-${ stageId }`,
    //   label:     `${ this.meta.name } - Staging - ${ stageId }`,
    //   product:   EPINIO_PRODUCT_NAME,
    //   icon:      'file',
    //   component: 'StagingLogs',
    //   attrs:     { application: this }
    // }, { root: true });
  }

  async waitForStaging(stageId) {
    this.trace('Waiting for Application bits to be staged');

    const opt = {
      url:     this.$getters['urlFor'](this.type, this.id, { url: `/api/v1/namespaces/${ this.meta.namespace }/staging/${ stageId }/complete` }),
      method:         'get',
      headers: {
        'content-type': 'application/json',
        accept:         'application/json'
      },
    };

    await this.$dispatch('request', { opt, type: this.type });
  }

  async deploy(stageId, image) {
    this.trace('Deploying Application bits');

    const stage = { };

    if (stageId) {
      stage.id = stageId;
    }

    const res = await this.followLink('deploy', {
      method:         'post',
      headers: { 'content-type': 'application/json' },
      data:    {
        app: {
          name:      this.meta.name,
          namespace: this.meta.namespace
        },
        stage,
        image
      }
    });

    this.route = res.route;
  }
}
