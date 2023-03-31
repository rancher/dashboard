import r from 'jsrsasign';
import { base64Decode } from '@shell/utils/crypto';

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

export function _getSubTypeDisplay(resource, rootGetters) {
  const type = resource._type || '';
  const fallback = type.replace(/^kubernetes.io\//, '');

  return rootGetters['i18n/translateWithFallback'](`secret.types."${ type }"`, null, fallback);
}

export function _getKeysDisplay(resource) {
  const keys = [
    ...Object.keys(resource.data || []),
    ...Object.keys(resource.binaryData || [])
  ];

  if ( !keys.length ) {
    return '(none)';
  }

  return keys.join(', ');
}

export function _getSshUser(resource) {
  if ( resource._type !== TYPES.SSH ) {
    return null;
  }

  const pub = base64Decode(resource.data['ssh-publickey']);

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

export function _getCertInfo(resource) {
  const pem = base64Decode(resource.data['tls.crt']);
  let issuer, notAfter, cn, sans, x;
  const END_MARKER = '-----END CERTIFICATE-----';

  if (pem) {
    const certs = pem.split(END_MARKER);
    let first = pem;

    if (certs.length > 1) {
      first = `${ certs[0] }${ END_MARKER }`;
    }

    try {
      x = new r.X509();

      x.readCertPEM(first);
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

export function _getDataPreview(resource) {
  if (resource._type === TYPES.DOCKER_JSON) {
    const encodedJSON = resource.data['.dockerconfigjson'];

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
  } else if (resource._type === TYPES.TLS) {
    return resource.certInfo || resource.keysDisplay;
  } else if ( resource._type === TYPES.BASIC ) {
    return base64Decode(resource.data.username);
  } else if ( resource._type === TYPES.SSH ) {
    return resource.sshUser;
  } else if ( resource._type === TYPES.SERVICE_ACCT ) {
    return resource.metadata?.annotations?.['kubernetes.io/service-account.name'];
  }

  return resource.keysDisplay;
}

export const calculatedFields = [
  { name: 'subTypeDisplay', func: _getSubTypeDisplay },
  { name: 'keysDisplay', func: _getKeysDisplay },
  { name: 'sshUser', func: _getSshUser },
  { name: 'certInfo', func: _getCertInfo },
  { name: 'dataPreview', func: _getDataPreview }
];
