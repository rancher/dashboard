import SteveModel from '@shell/plugins/steve/steve-class';

const CACHE_STATE = Object.freeze({
  CACHED:   'cached',
  DISABLED: 'disabled',
  PENDING:  'pending',
});

export default class UIPlugin extends SteveModel {
  get name() {
    return this.spec?.plugin?.name;
  }

  get description() {
    return this.spec?.plugin?.description;
  }

  get version() {
    return this.spec?.plugin?.version;
  }

  get isInitialized() {
    return this.status?.cacheState !== CACHE_STATE.PENDING;
  }

  get pluginMetadata() {
    return this.spec?.plugin?.metadata || {};
  }

  get isDeveloper() {
    return this.pluginMetadata?.developer === 'true';
  }

  get plugin() {
    return this.spec?.plugin || {};
  }
}
