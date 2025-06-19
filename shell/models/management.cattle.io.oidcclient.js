import SteveModel from '@/shell/plugins/steve/steve-class';

export default class OIDCClient extends SteveModel {
  get details() {
    return [
      ...this._details, {
        label:   this.t('oidcclient.redirectURIs.label'),
        content: this.spec.redirectURIs?.join(', ')
      }, {
        label:   this.t('oidcclient.refreshTokenExpirationSeconds.detailLabel'),
        content: this.spec.refreshTokenExpirationSeconds
      }, {
        label:   this.t('oidcclient.tokenExpirationSeconds.detailLabel'),
        content: this.spec.tokenExpirationSeconds
      }
    ];
  }
}
