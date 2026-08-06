import Secret from '@shell/models/secret';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { SERVICE_ACCOUNT } from '@shell/config/types';
import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_CLUSTER, CERTMANAGER } from '@shell/config/labels-annotations';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { STORE } from '@shell/store/store-types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { base64Encode, base64Decode } from '@shell/utils/crypto';

// A valid, self-signed 10 year certificate used to exercise the real jsrsasign parsing path.
// CN=test.example.com, SANs: test.example.com, *.example.com, www.example.com
// notBefore: 2026-08-06T12:39:13Z, notAfter: 2036-08-03T12:39:13Z
const TEST_CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIDVjCCAj6gAwIBAgIUCSnVWva2lqhAIsYNiWQ6/z5KX6AwDQYJKoZIhvcNAQEL
BQAwGzEZMBcGA1UEAwwQdGVzdC5leGFtcGxlLmNvbTAeFw0yNjA4MDYxMjM5MTNa
Fw0zNjA4MDMxMjM5MTNaMBsxGTAXBgNVBAMMEHRlc3QuZXhhbXBsZS5jb20wggEi
MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDW+mkSeXRrbO0DnTOD3nG4C254
I33MOwqaBMP49y2u0W8oDHRznEVGo3mCLs3eP7upikoDhtG8Z0vAp24s6hiiYjOZ
0xg00lcxy2zQ927vupbNcDexCVrPTltR6FEZeZpuBx3U1AgOu5+50BQBQf/p5Q2G
7XXDYrGMV3zPfwfFACEm28ws4LzWJp6ZULRHtIYANRXuosuRPcZ3ivMD7lZ5Fbj7
5E9zm/f267sQVlKc56abSHOPyxgvizD32PSOyOx65h0QGHsC4pNO+xuQK6nQlr7l
xO3WLQxcsaXwbcmr3kqgpJN1LPY4B4ulIEvp7TlqWU8gl0z/Lkr1QSEN5/mhAgMB
AAGjgZEwgY4wHQYDVR0OBBYEFEpsogHCd0+ofQgnKRnJ3r4l/nHyMB8GA1UdIwQY
MBaAFEpsogHCd0+ofQgnKRnJ3r4l/nHyMA8GA1UdEwEB/wQFMAMBAf8wOwYDVR0R
BDQwMoIQdGVzdC5leGFtcGxlLmNvbYINKi5leGFtcGxlLmNvbYIPd3d3LmV4YW1w
bGUuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQBzkPzuNf61zMFEfMKUKhNT1AHqey1e
sBhaazf3FEcdIJBc6thFtaURUnAf4TwUpBCp03vZtAfqp43IG2J1E9ls5cLix/IH
VGl/VSDkJonIEgDf82uHMe3G0z7TT7s1ip8WqfSy/dPEnrSzZZzegh0iKUZACEW5
ypd+n4cocaIunTTN0wjaEujoPmm5iqiGAVa7ThXVnjiMF339hcdoJvdS4wtEEcND
OXBBoVgfus15ldfG1GWYjFgVL2yagdzDcp0xTD7VsFkn2DA4nm/LmO/LhpaSR4Zh
y+lCdK7a+W0LW1MJu/aKYlCzkSEyErPA7hgxpeu95Wt5OdG/WH0UAVec
-----END CERTIFICATE-----
`;

describe('class Secret', () => {
  describe('supportsSshKnownHosts', () => {
    it.each([
      [
        false,
        'type is not SSH',
        'generic',
        { known_hosts: 'S05PV05fSE9TVFM=' },
      ],
      [
        false,
        'missing known_hosts',
        TYPES.SSH,
        {},
      ],
      [
        false,
        'data is null',
        TYPES.SSH,
        null,
      ],
      [
        true,
        'type is SSH key and known_hosts exists',
        TYPES.SSH,
        { known_hosts: 'S05PV05fSE9TVFM=' },
      ],
    ])('is %p if %p', (
      supported,
      descr,
      _type,
      data
    ) => {
      const secret = new Secret({ _type, data });

      const result = secret.supportsSshKnownHosts;

      expect(result).toBe(supported);
    });
  });

  describe('subTypeDisplay', () => {
    it('should fall back to a stripped type name when there is no translation', () => {
      const withFallback = jest.fn((_key: string, _args: any, fallback: string) => fallback);
      const secret = new Secret({ _type: TYPES.BASIC, data: { username: base64Encode('bob') } }, { rootGetters: { 'i18n/withFallback': withFallback } });

      expect(secret.subTypeDisplay).toBe('basic-auth');
      expect(withFallback).toHaveBeenCalledWith(`secret.types."${ TYPES.BASIC }"`, null, 'basic-auth');
    });
  });

  describe('type classification', () => {
    it.each([
      ['isCertificate', TYPES.TLS, true],
      ['isCertificate', TYPES.OPAQUE, false],
      ['isRegistry', TYPES.DOCKER_JSON, true],
      ['isRegistry', TYPES.TLS, false],
    ])('%s is %p for type %s', (getter, _type, expected) => {
      const secret = new Secret({ _type }) as any;

      expect(secret[getter]).toBe(expected);
    });

    it('isCloudCredential is true when _type is the cloud credential type', () => {
      const secret = new Secret({ _type: TYPES.CLOUD_CREDENTIAL });

      expect(secret.isCloudCredential).toBe(true);
    });

    it('isCloudCredential is true when namespace is cattle-global-data and generateName is cc-', () => {
      const secret = new Secret({
        _type:    TYPES.OPAQUE,
        metadata: { namespace: 'cattle-global-data', generateName: 'cc-' }
      });

      expect(secret.isCloudCredential).toBe(true);
    });

    it('isCloudCredential is false for an unrelated opaque secret', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, metadata: { namespace: 'default' } });

      expect(secret.isCloudCredential).toBe(false);
    });
  });

  describe('certInfo (real PEM parsing)', () => {
    it('parses issuer, cn, notBefore, notAfter and sans from a valid TLS cert', () => {
      const secret = new Secret({ _type: TYPES.TLS, data: { 'tls.crt': base64Encode(TEST_CERT_PEM) } });

      const info: any = secret.certInfo;

      expect(info.cn).toBe('test.example.com');
      expect(info.issuer).toBe('test.example.com');
      expect(info.notBefore.getUTCFullYear()).toBe(2026);
      expect(info.notAfter.getUTCFullYear()).toBe(2036);
      expect(info.sans.array).toHaveLength(3);
    });

    it('returns null when there is no tls.crt data key', () => {
      const secret = new Secret({ _type: TYPES.TLS, data: {} });

      expect(secret.certInfo).toBeNull();
    });

    it('returns null when the PEM cannot be parsed', () => {
      const secret = new Secret({ _type: TYPES.TLS, data: { 'tls.crt': base64Encode('not-a-real-certificate') } });

      expect(secret.certInfo).toBeNull();
    });

    it('isCertificate derived getters resolve using the parsed cert when there is no cert-manager annotation', () => {
      const secret = new Secret({
        _type: TYPES.TLS, data: { 'tls.crt': base64Encode(TEST_CERT_PEM) }, metadata: {}
      });

      expect(secret.cn).toBe('test.example.com');
      expect(secret.issuer).toBe('test.example.com');
      expect(secret.plusMoreNames).toBe(3);
    });

    it('issuer prefers the cert-manager annotation over the parsed cert issuer', () => {
      const secret = new Secret({
        _type:    TYPES.TLS,
        data:     { 'tls.crt': base64Encode(TEST_CERT_PEM) },
        metadata: { annotations: { [CERTMANAGER.ISSUER]: 'letsencrypt-prod' } }
      });

      expect(secret.issuer).toBe('letsencrypt-prod');
    });

    it('cn, issuer, notAfter and plusMoreNames are null for non-certificate secrets', () => {
      const secret = new Secret({
        _type: TYPES.OPAQUE, data: {}, metadata: {}
      });

      expect(secret.cn).toBeNull();
      expect(secret.issuer).toBeNull();
      expect(secret.notAfter).toBeNull();
      expect(secret.plusMoreNames).toBeNull();
    });
  });

  describe('cachedCertInfo', () => {
    it('parses certInfo once and reuses the cached value', () => {
      const secret = new Secret({ _type: TYPES.TLS, data: { 'tls.crt': base64Encode(TEST_CERT_PEM) } });
      const spy = jest.spyOn(secret, 'certInfo', 'get');

      const first = secret.cachedCertInfo;
      const second = secret.cachedCertInfo;

      expect(first).toBe(second);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('unrepeatedSans', () => {
    const makeCertSecretWithSans = (sans: any) => {
      const secret = new Secret({ _type: TYPES.TLS, data: {} });

      Object.defineProperty(secret, 'cachedCertInfo', { get: () => ({ sans }), configurable: true });

      return secret;
    };

    it('returns null for non-certificate secrets', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, data: {} });

      expect(secret.unrepeatedSans).toBeNull();
    });

    it('removes sans that exactly match the suffix of a wildcard/www entry', () => {
      const secret = makeCertSecretWithSans(['app.example.com', '.example.com', '*.example.com']);

      expect(secret.unrepeatedSans).toStrictEqual(['app.example.com', '*.example.com']);
    });

    it('leaves sans unchanged when no entry matches the wildcard/www suffix', () => {
      const secret = makeCertSecretWithSans(['test.example.com', '*.example.com', 'www.example.com']);

      expect(secret.unrepeatedSans).toStrictEqual(['test.example.com', '*.example.com', 'www.example.com']);
    });

    it('falls back to the .array property when sans is not a plain array (jsrsasign getExtSubjectAltName shape)', () => {
      const dnsEntries = [{ dns: 'test.example.com' }, { dns: '*.example.com' }];
      const secret = makeCertSecretWithSans({ extname: 'subjectAltName', array: dnsEntries });

      expect(secret.unrepeatedSans).toBe(dnsEntries);
    });

    it('returns an empty array when there are no sans', () => {
      const secret = makeCertSecretWithSans(undefined);

      expect(secret.unrepeatedSans).toStrictEqual([]);
    });
  });

  describe('tLS expiration state (dateClass, certState, certStateDisplay, certStateBackground, timeTilExpiration, timeTilExpirationDate)', () => {
    const DAY = 1000 * 60 * 60 * 24;

    const makeCertSecretWithNotAfter = (notAfter: Date | undefined) => {
      const secret = new Secret({ _type: TYPES.TLS, data: {} });

      Object.defineProperty(secret, 'cachedCertInfo', { get: () => ({ notAfter }), configurable: true });

      return secret;
    };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('is not expiring when notAfter is well beyond the expiring window', () => {
      const notAfter = new Date(Date.now() + 30 * DAY);
      const secret = makeCertSecretWithNotAfter(notAfter);

      expect(secret.certState).toBe('');
      expect(secret.dateClass).toBe('');
      expect(secret.certStateDisplay).toBe('Active');
      expect(secret.timeTilExpiration).toBeGreaterThan(8 * DAY);
      expect(secret.timeTilExpirationDate).toBe(notAfter.valueOf());
    });

    it('is expiring when notAfter is within the 8 day expiring window but still in the future', () => {
      const notAfter = new Date(Date.now() + 3 * DAY);
      const secret = makeCertSecretWithNotAfter(notAfter);

      expect(secret.certState).toBe(STATES_ENUM.EXPIRING);
      expect(secret.dateClass).toBe('text-warning');
      expect(secret.certStateDisplay).toBe('Expiring');
      expect(secret.certStateBackground).toBe('bg-warning');
      expect(secret.timeTilExpiration).toBeGreaterThan(0);
      expect(secret.timeTilExpirationDate).toBe(notAfter.valueOf());
    });

    it('is expired when notAfter is in the past', () => {
      const notAfter = new Date(Date.now() - DAY);
      const secret = makeCertSecretWithNotAfter(notAfter);

      expect(secret.certState).toBe(STATES_ENUM.EXPIRED);
      expect(secret.dateClass).toBe('text-error');
      expect(secret.certStateDisplay).toBe('Expired');
      expect(secret.certStateBackground).toBe('bg-error');
      expect(secret.timeTilExpiration).toBe(0);
      expect(secret.timeTilExpirationDate).toBeNull();
    });

    it('is undefined/null for non-certificate secrets', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, data: {} });

      expect(secret.certState).toBeUndefined();
      expect(secret.certStateDisplay).toBeUndefined();
      expect(secret.certStateBackground).toBeUndefined();
      expect(secret.dateClass).toBeNull();
      expect(secret.timeTilExpiration).toBeNull();
      expect(secret.timeTilExpirationDate).toBeNull();
    });
  });

  describe('certLifetime', () => {
    const t = (key: string) => key;

    it('returns a formatted duration string for a certificate', () => {
      const secret = new Secret({ _type: TYPES.TLS, data: {} }, { rootGetters: { 'i18n/t': t } });

      Object.defineProperty(secret, 'cachedCertInfo', {
        get:          () => ({ notBefore: new Date('2026-01-01T00:00:00Z'), notAfter: new Date('2026-01-11T00:00:00Z') }),
        configurable: true
      });

      expect(secret.certLifetime).toBe('10 unit.day');
    });

    it('returns null when there is no cert info', () => {
      const secret = new Secret({ _type: TYPES.TLS, data: {} }, { rootGetters: { 'i18n/t': t } });

      Object.defineProperty(secret, 'cachedCertInfo', { get: () => null, configurable: true });

      expect(secret.certLifetime).toBeNull();
    });

    it('returns null for non-certificate secrets', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, data: {} }, { rootGetters: { 'i18n/t': t } });

      expect(secret.certLifetime).toBeNull();
    });
  });

  describe('keysDisplay', () => {
    it('joins data and binaryData keys', () => {
      const secret = new Secret({ data: { foo: 'YmFy' }, binaryData: { img: 'aW1n' } });

      expect(secret.keysDisplay).toBe('foo, img');
    });

    it('returns (none) when there are no keys', () => {
      const secret = new Secret({});

      expect(secret.keysDisplay).toBe('(none)');
    });
  });

  describe('dataPreview', () => {
    it('lists the auths domains for a valid dockerconfigjson secret', () => {
      const dockerConfig = { auths: { 'index.docker.io': {}, 'quay.io': {} } };
      const secret = new Secret({ _type: TYPES.DOCKER_JSON, data: { '.dockerconfigjson': base64Encode(JSON.stringify(dockerConfig)) } });

      expect(secret.dataPreview).toBe('index.docker.io, quay.io');
    });

    it('falls back to the raw decoded string when dockerconfigjson is not valid JSON', () => {
      const secret = new Secret({ _type: TYPES.DOCKER_JSON, data: { '.dockerconfigjson': base64Encode('not json') } });

      expect(secret.dataPreview).toBe('not json');
    });

    it('shows the decoded username for basic-auth secrets', () => {
      const secret = new Secret({ _type: TYPES.BASIC, data: { username: base64Encode('my-user') } });

      expect(secret.dataPreview).toBe('my-user');
    });

    it('shows the sshUser for ssh-auth secrets', () => {
      const secret = new Secret({
        _type: TYPES.SSH,
        data:  { 'ssh-publickey': base64Encode('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC user@host') }
      });

      expect(secret.dataPreview).toBe('user@host');
    });

    it('shows the service account name annotation for service account secrets', () => {
      const secret = new Secret({
        _type:    TYPES.SERVICE_ACCT,
        metadata: { annotations: { 'kubernetes.io/service-account.name': 'my-sa' } }
      });

      expect(secret.dataPreview).toBe('my-sa');
    });

    it('shows the cert info for TLS secrets', () => {
      const secret = new Secret({ _type: TYPES.TLS, data: { 'tls.crt': base64Encode(TEST_CERT_PEM) } });

      expect(secret.dataPreview).toStrictEqual(secret.certInfo);
    });

    it('falls back to keysDisplay for unrecognized secret types', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, data: { key1: 'dmFsdWU=' } });

      expect(secret.dataPreview).toBe('key1');
    });
  });

  describe('sshUser', () => {
    it('returns null when the secret is not an SSH secret', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, data: {} });

      expect(secret.sshUser).toBeNull();
    });

    it('returns null when there is no ssh-publickey data', () => {
      const secret = new Secret({ _type: TYPES.SSH, data: {} });

      expect(secret.sshUser).toBeNull();
    });

    it('extracts the user from an OpenSSH format public key', () => {
      const secret = new Secret({
        _type: TYPES.SSH,
        data:  { 'ssh-publickey': base64Encode('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC user@example.com') }
      });

      expect(secret.sshUser).toBe('user@example.com');
    });

    it('extracts the user from a PEM format public key comment', () => {
      const secret = new Secret({
        _type: TYPES.SSH,
        data:  { 'ssh-publickey': base64Encode('----BEGIN SSH2 PUBLIC KEY----\nComment: "imported-openssh-key from OpenSSH by someuser@host"\nAAAA\n----END SSH2 PUBLIC KEY----') }
      });

      expect(secret.sshUser).toBe('someuser@host');
    });

    it('returns null when the public key format is unrecognized', () => {
      const secret = new Secret({ _type: TYPES.SSH, data: { 'ssh-publickey': base64Encode('not-a-key') } });

      expect(secret.sshUser).toBeNull();
    });
  });

  describe('decodedData', () => {
    it('base64 decodes every key in data', () => {
      const secret = new Secret({ data: { foo: base64Encode('bar'), baz: base64Encode('qux') } });

      expect(secret.decodedData).toStrictEqual({ foo: 'bar', baz: 'qux' });
    });

    it('returns an empty object when there is no data', () => {
      const secret = new Secret({});

      expect(secret.decodedData).toStrictEqual({});
    });
  });

  describe('setData', () => {
    it('sets and base64 encodes a single key/value pair, initializing data', () => {
      const secret = new Secret({});

      secret.setData('foo', 'bar');

      expect(base64Decode((secret as any).data.foo)).toBe('bar');
    });

    it('sets a map of key/value pairs, replacing existing data', () => {
      const secret = new Secret({ data: { existing: base64Encode('old') } });

      secret.setData({ foo: 'bar', baz: 'qux' });

      expect((secret as any).data.existing).toBeUndefined();
      expect(base64Decode((secret as any).data.foo)).toBe('bar');
      expect(base64Decode((secret as any).data.baz)).toBe('qux');
    });

    it('handles keys containing dots without treating them as a path', () => {
      const secret = new Secret({});

      secret.setData('.dockerconfigjson', '{}');

      expect(base64Decode((secret as any).data['.dockerconfigjson'])).toBe('{}');
    });
  });

  describe('hasProjectScopedUrlQueryParam', () => {
    it('is true when the current route has the project-scoped query param', () => {
      const secret = new Secret({});

      jest.spyOn(secret, 'currentRoute').mockReturnValue({ query: { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.PROJECT_SCOPED } } as any);

      expect(secret.hasProjectScopedUrlQueryParam).toBe(true);
    });

    it('is false without the query param', () => {
      const secret = new Secret({});

      jest.spyOn(secret, 'currentRoute').mockReturnValue({ query: {} } as any);

      expect(secret.hasProjectScopedUrlQueryParam).toBe(false);
    });

    it('is false when there is no current route', () => {
      const secret = new Secret({});

      jest.spyOn(secret, 'currentRoute').mockReturnValue(undefined as any);

      expect(secret.hasProjectScopedUrlQueryParam).toBe(false);
    });
  });

  describe('groupByProject', () => {
    it('is undefined when the secret is not project scoped', () => {
      const secret = new Secret({ metadata: { labels: {} } }, { rootGetters: { isRancher: true } });

      expect(secret.groupByProject).toBeUndefined();
    });

    it('renders a translated group label using the project display name when project scoped', () => {
      const project = { nameDisplay: 'My Project' };
      const t = jest.fn().mockImplementation((key: string, args: any) => `${ key }:${ args.name }`);
      const secret = new Secret({ metadata: { labels: { [UI_PROJECT_SECRET]: 'p-project', [UI_PROJECT_SECRET_CLUSTER]: 'c-cluster' } } }, {
        rootGetters: {
          isRancher: true, 'i18n/t': t, [`${ STORE.MANAGEMENT }/byId`]: () => project
        }
      });

      expect(secret.groupByProject).toBe('resourceTable.groupLabel.project:My Project');
    });
  });

  describe('fullDetailPageOverride', () => {
    it('is always true', () => {
      const secret = new Secret({});

      expect(secret.fullDetailPageOverride).toBe(true);
    });
  });

  describe('details', () => {
    const ctx = {
      getters:     { schemaFor: () => ({ id: 'secret' }) },
      rootGetters: {
        'type-map/labelFor': () => 'Secret',
        'i18n/t':            (key: string) => key
      }
    };

    it('includes only the type by default', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, metadata: {} }, ctx);

      expect(secret.details).toStrictEqual([{ label: 'secret.type', content: 'Secret' }]);
    });

    it('includes a Service Account link for service account secrets', () => {
      const secret = new Secret({
        _type:    TYPES.SERVICE_ACCT,
        metadata: { namespace: 'default', annotations: { 'kubernetes.io/service-account.name': 'my-sa' } }
      }, ctx);

      const serviceAccountDetail = secret.details.find((d: any) => d.label === 'Service Account');

      expect(serviceAccountDetail).toStrictEqual({
        label:         'Service Account',
        formatter:     'LinkName',
        formatterOpts: {
          value: 'my-sa', type: SERVICE_ACCOUNT, namespace: 'default'
        },
        content: 'my-sa'
      });
    });

    it('includes cn, issuer and expiry for certificate secrets', () => {
      const secret = new Secret({
        _type: TYPES.TLS, data: { 'tls.crt': base64Encode(TEST_CERT_PEM) }, metadata: {}
      }, ctx);

      const labels = secret.details.map((d: any) => d.label);

      expect(labels).toStrictEqual(['secret.type', 'secret.certificate.cn', 'secret.certificate.issuer', 'Expires']);
    });
  });
});
