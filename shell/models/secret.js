import r from 'jsrsasign';
import { CERTMANAGER, KUBERNETES } from '@shell/config/labels-annotations';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import { removeObjects } from '@shell/utils/array';
import { SERVICE_ACCOUNT } from '@shell/config/types';
import { set } from '@shell/utils/object';
import { NAME as MANAGER } from '@shell/config/product/manager';
import SteveModel from '@shell/plugins/steve/steve-class';

export const TYPES = {
  OPAQUE:           'Opaque',
  SERVICE_ACCT:     'kubernetes.io/service-account-token',
  DOCKER:           'kubernetes.io/dockercfg',
  DOCKER_JSON:      'kubernetes.io/dockerconfigjson',
  BASIC:            'kubernetes.io/basic-auth',
  SSH:              'kubernetes.io/ssh-auth',
  TLS:              'kubernetes.io/tls',
  BOOTSTRAP:        'bootstrap.kubernetes.io/token',
  ISTIO_TLS:        'istio.io/key-and-cert',
  HELM_RELEASE:     'helm.sh/release.v1',
  FLEET_CLUSTER:    'fleet.cattle.io/cluster-registration-values',
  CLOUD_CREDENTIAL: 'provisioning.cattle.io/cloud-credential',
  RKE_AUTH_CONFIG:  'rke.cattle.io/auth-config'
};

export default class Secret extends SteveModel {
  get hasSensitiveData() {
    return true;
  }

  get isCertificate() {
    return this._type === TYPES.TLS;
  }

  get isRegistry() {
    return this._type === TYPES.DOCKER_JSON;
  }

  get isCloudCredential() {
    return this._type === TYPES.CLOUD_CREDENTIAL || (this.metadata.namespace === 'cattle-global-data' && this.metadata.generateName === 'cc-');
  }

  get issuer() {
    const { metadata:{ annotations = {} } } = this;

    if (annotations[CERTMANAGER.ISSUER]) {
      return annotations[CERTMANAGER.ISSUER];
    } else if (this.isCertificate) {
      return this.certInfo?.issuer;
    } else {
      return null;
    }
  }

  get notAfter() {
    if (this.isCertificate) {
      return this.certInfo?.notAfter;
    } else {
      return null;
    }
  }

  get cn() {
    if (this.isCertificate) {
      return this.certInfo?.cn;
    }

    return null;
  }

  // show plus n more for cert names
  get plusMoreNames() {
    if (this.isCertificate) {
      return this.unrepeatedSans.length;
    }

    return null;
  }

  // use text-warning' or 'text-error' if cert is expiring within 8 days or is expired
  get dateClass() {
    if (this.isCertificate) {
      const eightDays = 691200000;

      if (this.timeTilExpiration > eightDays ) {
        return '';
      } else if (this.timeTilExpiration > 0) {
        return 'text-warning';
      } else {
        return 'text-error';
      }
    }

    return null;
  }

  get details() {
    const out = [
      {
        label:   this.t('secret.type'),
        content: this.typeDisplay
      }
    ];

    if ( this._type === TYPES.SERVICE_ACCT ) {
      const name = this.metadata?.annotations?.[KUBERNETES.SERVICE_ACCOUNT_NAME];

      if ( name ) {
        out.push({
          label:         'Service Account',
          formatter:     'LinkName',
          formatterOpts: {
            value:     name,
            type:      SERVICE_ACCOUNT,
            namespace: this.namespace,
          },
          content: name,
        });
      }
    }

    if (this.cn) {
      out.push({
        label:   this.t('secret.certificate.cn'),
        content: this.plusMoreNames ? `${ this.cn } ${ this.t('secret.certificate.plusMore', { n: this.plusMoreNames }) }` : this.cn
      });
    }

    if (this.issuer) {
      out.push({
        label:   this.t('secret.certificate.issuer'),
        content: this.issuer
      });
    }

    if (this.notAfter) {
      out.push({
        label:         'Expires',
        formatter:     'Date',
        formatterOpts: { class: this.dateClass },
        content:       this.notAfter
      });
    }

    return out;
  }

  get canUpdate() {
    if ( !this.hasLink('update') ) {
      return false;
    }

    if ( this._type === TYPES.SERVICE_ACCT ) {
      return false;
    }

    return this.$rootGetters['type-map/optionsFor'](this.type).isEditable;
  }

  get keysDisplay() {
    const keys = [
      ...Object.keys(this.data || []),
      ...Object.keys(this.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    // if ( keys.length >= 4 ) {
    //   return `${keys[0]}, ${keys[1]}, ${keys[2]} and ${keys.length - 3} more`;
    // }

    return keys.join(', ');
  }

  // decode some secret data to show in list view
  get dataPreview() {
    if (this._type === TYPES.DOCKER_JSON) {
      const encodedJSON = this.data['.dockerconfigjson'];

      if (encodedJSON) {
        const decodedJSON = base64Decode(encodedJSON);

        try {
          const auths = JSON.parse(decodedJSON).auths;
          const out = [];

          for (const domain in auths) {
            out.push(domain);
          }

          return out.join(', ');
        } catch (e) {
          return decodedJSON;
        }
      }
    } else if (this._type === TYPES.TLS) {
      return this.certInfo || this.keysDisplay;
    } else if ( this._type === TYPES.BASIC ) {
      return base64Decode(this.data.username);
    } else if ( this._type === TYPES.SSH ) {
      return this.sshUser;
    } else if ( this._type === TYPES.SERVICE_ACCT ) {
      return this.metadata?.annotations?.['kubernetes.io/service-account.name'];
    }

    return this.keysDisplay;
  }

  get sshUser() {
    if ( this._type !== TYPES.SSH ) {
      return null;
    }

    const pub = base64Decode(this.data['ssh-publickey']);

    if ( !pub ) {
      return null;
    }

    if ( pub.startsWith('----') ) {
      // PEM format
      const match = pub.match(/from OpenSSH by ([^"]+)"/);

      if ( match ) {
        return match[1];
      }
    } else if ( pub.startsWith('ssh-') ) {
      // OpenSSH format
      const parts = pub.replace(/\n/g, '').split(/\s+/);

      if ( parts && parts.length === 3 ) {
        return parts[2];
      }
    }

    return null;
  }

  get subTypeDisplay() {
    const type = this._type || '';
    const fallback = type.replace(/^kubernetes.io\//, '');

    return this.$rootGetters['i18n/withFallback'](`secret.types."${ type }"`, null, fallback);
  }

  // parse TLS certs and return issuer, notAfter, cn, sans
  get certInfo() {
    const pem = base64Decode(this.data['tls.crt']);
    let issuer, notAfter, cn, sans, x;

    if (pem) {
      try {
        x = new r.X509();

        x.readCertPEM(pem);
        const issuerString = x.getIssuerString();

        issuer = issuerString.slice(issuerString.indexOf('CN=') + 3);
        notAfter = r.zulutodate(x.getNotAfter());

        const cnString = x.getSubjectString();

        cn = cnString.slice(cnString.indexOf('CN=') + 3);
      } catch {
        return null;
      }

      try {
        sans = x.getExtSubjectAltName();
      } catch (e) {
        sans = [];
      }

      return {
        issuer, notAfter, cn, sans
      };
    }

    return null;
  }

  // use for + n more name display
  get unrepeatedSans() {
    if (this._type === TYPES.TLS ) {
      if (this.certInfo?.sans?.filter) {
        const commonBases = this.certInfo?.sans.filter(name => name.indexOf('*.') === 0 || name.indexOf('www.') === 0).map(name => name.substr(name.indexOf('.')));
        const displaySans = removeObjects(this.certInfo?.sans, commonBases);

        return displaySans;
      }

      return this.certInfo?.sans || [];
    }

    return null;
  }

  get timeTilExpiration() {
    if (this._type === TYPES.TLS) {
      const expiration = this.certInfo.notAfter;
      const timeThen = expiration.valueOf();
      const timeNow = Date.now();

      return timeThen - timeNow;
    }

    return null;
  }

  get decodedData() {
    const out = {};

    for ( const k in this.data || {} ) {
      out[k] = base64Decode(this.data[k]);
    }

    return out;
  }

  get setData() {
    return (key, value) => { // or (mapOfNewData)
      const isMap = key && typeof key === 'object';

      if ( !this.data || isMap ) {
        set(this, 'data', {});
      }

      let neu;

      if ( isMap ) {
        neu = key;
      } else {
        neu = { [key]: value };
      }

      for ( const k in neu ) {
        // The key is quoted so that keys like '.dockerconfigjson' that contain dot don't get parsed into an object path
        set(this.data, `"${ k }"`, base64Encode(neu[k]));
      }
    };
  }

  get doneRoute() {
    if ( this.$rootGetters['currentProduct'].name === MANAGER ) {
      return 'c-cluster-manager-secret';
    } else {
      return 'c-cluster-product-resource';
    }
  }
}
