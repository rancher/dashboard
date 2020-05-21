import r from 'jsrsasign';
import { KUBERNETES } from '@/config/labels-annotations';
import { base64Decode } from '@/utils/crypto';
import { removeObjects } from '@/utils/array';
export const OPAQUE = 'Opaque';
export const SERVICE_ACCT = 'kubernetes.io/service-account-token';
export const DOCKER = 'kubernetes.io/dockercfg';
export const DOCKER_JSON = 'kubernetes.io/dockerconfigjson';
export const BASIC = 'kubernetes.io/basic-auth';
export const SSH = 'kubernetes.io/ssh-auth';
export const TLS = 'kubernetes.io/tls';
export const BOOTSTRAP = 'bootstrap.kubernetes.io/token';
export const ISTIO_TLS = 'istio.io/key-and-cert';

const DISPLAY_TYPES = {
  [OPAQUE]:       'Opaque',
  [SERVICE_ACCT]: 'Service Acct Token',
  [DOCKER]:       'Registry',
  [DOCKER_JSON]:  'Registry',
  [BASIC]:        'Basic Auth',
  [SSH]:          'SSH',
  [TLS]:          'Certificate',
  [BOOTSTRAP]:    'Bootstrap Token',
  [ISTIO_TLS]:    'Certificate (Istio)',
};

export default {
  canUpdate() {
    return this.hasLink('update') && this.$rootGetters['type-map/isEditable'](this.type) && this.secretType !== SERVICE_ACCT;
  },

  keysDisplay() {
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
  },

  // decode some secret data to show in list view
  dataPreview() {
    if (this._type === DOCKER_JSON) {
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
    } else if (this._type === TLS) {
      return this.certInfo || this.keysDisplay;
    } else {
      return this.keysDisplay;
    }
  },

  secretType() {
    return this._type;
  },

  typeDisplay() {
    const mapped = DISPLAY_TYPES[this._type];

    if ( mapped ) {
      return mapped;
    }

    return (this._type || '').replace(/^kubernetes.io\//, '');
  },

  tableTypeDisplay() {
    if (this._type === SERVICE_ACCT) {
      return { typeDisplay: this.typeDisplay, serviceAccountID: this.serviceAccountID };
    } else {
      return this.typeDisplay;
    }
  },

  serviceAccountID() {
    if (this.secretType === SERVICE_ACCT) {
      const name = this.metadata.annotations[KUBERNETES.SERVICE_ACCOUNT_NAME];
      const namespace = this.namespace;
      let fqid = name;

      if (namespace ) {
        fqid = `${ namespace }/${ name }`;
      }

      return fqid;
    }

    return null;
  },

  // parse TLS certs and return issuer, notAfter, cn, sans
  certInfo() {
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
  },

  // use for + n more name display
  unrepeatedSans() {
    if (this._type === TLS ) {
      const commonBases = this.certInfo.sans.filter(name => name.indexOf('*.') === 0 || name.indexOf('www.') === 0).map(name => name.substr(name.indexOf('.')));
      const displaySans = removeObjects(this.certInfo.sans, commonBases);

      return displaySans;
    }
  },

  timeTilExpiration() {
    if (this._type === TLS) {
      const expiration = this.certInfo.notAfter;
      const timeThen = expiration.valueOf();
      const timeNow = Date.now();

      return timeThen - timeNow;
    }
  },
};
