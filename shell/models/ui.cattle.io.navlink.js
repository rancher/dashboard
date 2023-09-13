import { proxyUrlFromParts } from '@shell/models/service';
import SteveModel from '@shell/plugins/steve/steve-class';

const NAVLINK_IFRAME = 'navlink.pandaria.io/iframe';

export default class extends SteveModel {
  get labelDisplay() {
    return this.spec?.label || this.metadata.name || '?';
  }

  get link() {
    const index = window.location.pathname.indexOf('/ui.cattle.io.navlink');

    if (this.isIframe && index > -1) {
      if ( this.spec?.toURL ) {
        return `/c/${ this.$rootGetters['clusterId'] }/explorer/navLinks/iframe?link=${ encodeURIComponent(this.spec.toURL) }`;
      } else if ( this.spec?.toService ) {
        const s = this.spec.toService;

        return `/c/${ this.$rootGetters['clusterId'] }/explorer/navLinks/iframe?link=${ encodeURIComponent(proxyUrlFromParts(this.$rootGetters['clusterId'], s.namespace, s.name, s.scheme, s.port, s.path)) }`;
      } else {
        return null;
      }
    }

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
    return (this.spec.target || '').trim() || '_self';
  }

  get isIframe() {
    return this.metadata.labels?.[NAVLINK_IFRAME] === 'true';
  }

  get iframeSrc() {
    if (!this.isIframe) {
      return '';
    }

    if ( this.spec?.toURL ) {
      return this.spec.toURL;
    } else if ( this.spec?.toService ) {
      const s = this.spec.toService;

      return proxyUrlFromParts(this.$rootGetters['clusterId'], s.namespace, s.name, s.scheme, s.port, s.path);
    } else {
      return null;
    }
  }
}
