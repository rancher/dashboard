import SteveModel from '@shell/plugins/steve/steve-class';
import { _getDescription, _getName, _getVersion } from '@shell/plugins/steve/resourceUtils/catalog.cattle.io.uiplugin';

const CACHED_STATUS = 'cached';

export default class UIPlugin extends SteveModel {
  get name() {
    return _getName(this);
  }

  get description() {
    return _getDescription(this);
  }

  get version() {
    return _getVersion(this);
  }

  get willBeCached() {
    return this.spec?.plugin?.noCache === false;
  }

  // Has the plugin been cached?
  get isCached() {
    return !this.willBeCached || (this.willBeCached && this.status?.cacheState === CACHED_STATUS);
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
