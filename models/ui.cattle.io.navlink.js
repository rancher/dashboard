import { proxyUrlFromParts } from '@/models/service';

export default {
  labelDisplay() {
    return this.spec?.label || this.metadata.name || '?';
  },

  link() {
    if ( this.spec?.toURL ) {
      return this.spec.toURL;
    } else if ( this.spec?.toService ) {
      const s = this.spec.toService;

      return proxyUrlFromParts(this.$rootGetters['clusterId'], s.namespace, s.name, s.scheme, s.port, s.path);
    } else {
      return null;
    }
  },

  normalizedGroup() {
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
  },

  actualTarget() {
    return (this.spec.target || '').trim() || '_blank';
  },
};
