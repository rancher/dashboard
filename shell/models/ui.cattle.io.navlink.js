import { proxyUrlFromParts } from '@shell/models/service';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class extends SteveModel {
  get labelDisplay() {
    return this.spec?.label || this.metadata.name || '?';
  }

  get link() {
    if ( this.spec?.toURL ) {
      return this.spec.toURL;
    } else if ( this.spec?.toService ) {
      const s = this.spec.toService;

      return proxyUrlFromParts(this.$rootGetters['clusterId'], s.namespace, s.name, s.scheme, s.port, s.path);
    } else {
      return null;
    }
  }

  get normalizedGroup() {
    if ( !this.spec.group ) {
      return null;
    }

    return this.spec.group
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  get actualTarget() {
    return (this.spec.target || '').trim() || '_blank';
  }
}
