import { Resource } from '@/plugins/core-store/resource-class';
import { APPLICATION_ACTION_STATE, APPLICATION_SOURCE_TYPE } from '@/products/epinio/types';
import { epinioExceptionToErrorsArray } from '@/products/epinio/utils/errors';
import Vue from 'vue';

export const APPLICATION_ACTION_TYPE = {
  CREATE: 'create',
  UPLOAD: 'upload',
  BUILD:    'build',
  DEPLOY: 'deploy',
};

export default class ApplicationActionResource extends Resource {
  // Props ---------------------------------------------------
  run = true;
  state = APPLICATION_ACTION_STATE.PENDING;

  get name() {
    return this.t(`epinio.applications.action.${ this.action }.label`);
  }

  get description() {
    return this.t(`epinio.applications.action.${ this.action }.description`);
  }

  get stateObj() {
    switch (this.state) {
    case APPLICATION_ACTION_STATE.SUCCESS:
      return {
        name:          'succeeded',
        error:         false,
        transitioning: false,
      };
    case APPLICATION_ACTION_STATE.RUNNING:
      return {
        name:          'pending',
        error:         false,
        transitioning: true,
      };
    case APPLICATION_ACTION_STATE.FAIL:
      return {
        name:          'fail',
        error:         true,
        transitioning: false,
        message:       this.stateMessage
      };
    case APPLICATION_ACTION_STATE.PENDING:
    default:
      return {
        name:          'pending',
        error:         false,
        transitioning: false,
      };
    }
  }

  // Private ---------------------------------------------------

  async innerExecute(params) {
    switch (this.action) {
    case APPLICATION_ACTION_TYPE.CREATE:
      await this.create(params);
      break;
    case APPLICATION_ACTION_TYPE.UPLOAD:
      await this.upload(params);
      break;
    case APPLICATION_ACTION_TYPE.BUILD:
      await this.build(params);
      break;
    case APPLICATION_ACTION_TYPE.DEPLOY:
      await this.deploy(params);
      break;
    }
  }

  async create() {
    await this.application.create();
  }

  async upload({ source }) {
    await this.application.storeArchive(source.tarball);
  }

  async build({ source }) {
    const { stage } = await this.application.stage(this.application.buildCache.store.blobUid, source.builderImage);

    this.application.showStagingLog(stage.id);

    await this.application.waitForStaging(stage.id);
  }

  async deploy({ source }) {
    this.application.showAppLog();
    const stageId = source.type === APPLICATION_SOURCE_TYPE.ARCHIVE ? this.application.buildCache.stage.stage.id : null;
    const image = source.type === APPLICATION_SOURCE_TYPE.CONTAINER_URL ? source.url : this.application.buildCache.stage.image;

    await this.application.deploy(stageId, image);
  }

  // TODO: RC Wait for `running`?

  // Public ---------------------------------------------------

  async execute(params) {
    try {
      Vue.set(this, 'state', APPLICATION_ACTION_STATE.RUNNING);

      await this.innerExecute(params);

      Vue.set(this, 'state', APPLICATION_ACTION_STATE.SUCCESS);
      Vue.set(this, 'run', false);
    } catch (err) {
      Vue.set(this, 'state', APPLICATION_ACTION_STATE.FAIL);
      Vue.set(this, 'stateMessage', epinioExceptionToErrorsArray(err)[0].toString());

      throw err;
    }
  }
}
