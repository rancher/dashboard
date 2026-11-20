const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const zlib = require('node:zlib');
const {
  NEUTRAL_ORIGIN,
  PLACEHOLDER,
  PLACEHOLDER_B64,
  Scrubber,
  check,
  readBundle,
  scrub,
  scrubEntry,
  writeBundle,
} = require('../mocks');

describe('e2e-modes mocks Scrubber', () => {
  it('scrubs case-insensitive and cloud/Rancher secret keys', () => {
    const scrubber = new Scrubber();
    const input = {
      Password:          'Sup3rS3cretP@ss!',
      ClientSecret:      'my-azure-client-secret-9999',
      authEncodedJson:   '{"type":"service_account","private_key":"secret-gcp-key"}',
      kubeconfigContent: 'apiVersion: v1\nkind: Config\nclusters:\n- name: prod-secret-cluster',
      bootstrapPassword: 'boot-password-12345',
      'tls.key':         'raw-tls-key-material-12345',
      safeField:         'normal-value-12345',
    };

    const out = scrubber.json(input, 'test');

    assert.strictEqual(out.Password, PLACEHOLDER);
    assert.strictEqual(out.ClientSecret, PLACEHOLDER);
    assert.strictEqual(out.authEncodedJson, PLACEHOLDER);
    assert.strictEqual(out.kubeconfigContent, PLACEHOLDER);
    assert.strictEqual(out.bootstrapPassword, PLACEHOLDER);
    assert.strictEqual(out['tls.key'], PLACEHOLDER);
    assert.strictEqual(out.safeField, 'normal-value-12345');
  });

  it('recursively scrubs Kubernetes Secrets embedded in last-applied-configuration JSON strings', () => {
    const scrubber = new Scrubber();
    const secretVal = Buffer.from('ultra-secret-db-password-42').toString('base64');
    const embeddedSecret = JSON.stringify({
      apiVersion: 'v1',
      kind:       'Secret',
      type:       'Opaque',
      data:       { dbPassword: secretVal },
    });
    const input = {
      metadata: {
        name:        'my-secret',
        annotations: { 'kubectl.kubernetes.io/last-applied-configuration': embeddedSecret },
      },
    };

    const out = scrubber.json(input, 'test');
    const reparsed = JSON.parse(out.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration']);

    assert.strictEqual(reparsed.data.dbPassword, PLACEHOLDER_B64);
    assert.ok(!out.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'].includes(secretVal));
  });

  it('scrubs YAML client-key-data and Rancher kubeconfig tokens inside config strings', () => {
    const scrubber = new Scrubber();
    const fakeKeyB64 = Buffer.from('-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA\n-----END RSA PRIVATE KEY-----').toString('base64');
    const fakeToken = 'kubeconfig-user-abcde:1234567890abcdefghijklmnopqrstuvwxyz1234567890';
    const kubeconfigYaml = [
      'apiVersion: v1',
      'kind: Config',
      'users:',
      '- name: local',
      '  user:',
      `    token: ${ fakeToken }`,
      `    client-key-data: ${ fakeKeyB64 }`,
    ].join('\n');

    const out = scrubber.json({ config: kubeconfigYaml }, 'test');

    assert.ok(!out.config.includes(fakeKeyB64));
    assert.ok(!out.config.includes('1234567890abcdefghijklmnopqrstuvwxyz1234567890'));
    assert.ok(out.config.includes(`client-key-data: ${ PLACEHOLDER_B64 }`));
    assert.ok(out.config.includes(`kubeconfig-user-abcde:${ PLACEHOLDER }`));
  });

  it('scrubs secret query parameters in request.url, queryString, redirectURL, and location headers', () => {
    const scrubber = new Scrubber();
    const entry = {
      request: {
        url:         'https://127.0.0.1.sslip.io/v3/auth?token=supersecrettoken123&page=1',
        headers:     [],
        queryString: [
          { name: 'token', value: 'supersecrettoken123' },
          { name: 'page', value: '1' },
        ],
      },
      response: {
        headers:     [{ name: 'Location', value: 'https://127.0.0.1.sslip.io/callback?access_token=oauthsecretvalue987&state=ok' }],
        redirectURL: 'https://127.0.0.1.sslip.io/callback?access_token=oauthsecretvalue987&state=ok',
        content:     {},
      },
    };

    const out = scrubEntry(scrubber, entry, 'test');

    assert.ok(!out.request.url.includes('supersecrettoken123'));
    assert.strictEqual(out.request.queryString[0].value, PLACEHOLDER);
    assert.strictEqual(out.request.queryString[1].value, '1');
    assert.ok(!out.response.redirectURL.includes('oauthsecretvalue987'));
    assert.ok(!out.response.headers[0].value.includes('oauthsecretvalue987'));
  });

  it('scrubs printable binary WebSocket frames (opcode 2)', () => {
    const scrubber = new Scrubber();
    const secretJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const entry = {
      request: {
        url: 'https://127.0.0.1.sslip.io/k8s/clusters/local/api/v1/pods/exec', headers: [], queryString: []
      },
      response: {
        headers: [], redirectURL: '', content: {}
      },
      _webSocketMessages: [
        {
          type:   'receive',
          time:   1,
          opcode: 2,
          data:   Buffer.from(`export TOKEN=${ secretJwt }\n`, 'utf8').toString('base64'),
        },
      ],
    };

    const out = scrubEntry(scrubber, entry, 'test');
    const decoded = Buffer.from(out._webSocketMessages[0].data, 'base64').toString('utf8');

    assert.ok(!decoded.includes(secretJwt));
    assert.ok(decoded.includes(PLACEHOLDER));
  });

  it('preserves public certificates in Kubernetes Secrets while redacting private keys', () => {
    const scrubber = new Scrubber();
    const certB64 = Buffer.from('-----BEGIN CERTIFICATE-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A\n-----END CERTIFICATE-----\n').toString('base64');
    const keyB64 = Buffer.from('-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcw\n-----END PRIVATE KEY-----\n').toString('base64');
    const secret = {
      kind: 'Secret',
      type: 'kubernetes.io/tls',
      data: {
        'tls.crt': certB64,
        'tls.key': keyB64,
      },
    };

    const out = scrubber.json(secret, 'test');

    assert.strictEqual(out.data['tls.crt'], certB64);
    assert.strictEqual(out.data['tls.key'], PLACEHOLDER_B64);
  });

  it('normalizes non-local origins and scrubs printable .bin bodies during pack', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-mocks-test-'));

    try {
      const secretBody = 'password=VeryPrivateCorpPassword99';
      const bodyRel = 'ab/abcdef.bin.gz';
      const bodyPath = path.join(tmp, 'bodies', bodyRel);

      fs.mkdirSync(path.dirname(bodyPath), { recursive: true });
      fs.writeFileSync(bodyPath, zlib.gzipSync(Buffer.from(secretBody, 'utf8')));

      const harPath = path.join(tmp, 'admin', 'pages', 'sample.har');

      fs.mkdirSync(path.dirname(harPath), { recursive: true });
      fs.writeFileSync(harPath, JSON.stringify({
        log: {
          version: '1.2',
          _origin: 'https://rancher.corp.internal:8443',
          pages:   [{
            id: 'test 1', title: 'test 1', startedDateTime: '2026-01-01T00:00:00.000Z', pageTimings: {}
          }],
          entries: [
            {
              pageref:         'test 1',
              startedDateTime: '2026-01-01T00:00:01.000Z',
              time:            10,
              request:         {
                method:      'POST',
                url:         'https://rancher.corp.internal:8443/v3/login',
                headers:     [],
                queryString: [],
                postData:    { mimeType: 'application/json', text: JSON.stringify({ password: 'VeryPrivateCorpPassword99' }) },
              },
              response: {
                status:      200,
                headers:     [],
                redirectURL: '',
                content:     {
                  size: secretBody.length, mimeType: 'application/octet-stream', _file: bodyRel
                },
              },
            },
          ],
        },
      }));

      const { bundle } = scrub(tmp, 'admin');
      const bundleFile = path.join(tmp, 'out.json.br');

      writeBundle(bundle, bundleFile);

      const loaded = readBundle(bundleFile);
      const serialized = JSON.stringify(loaded);

      assert.ok(!serialized.includes('rancher.corp.internal'), 'non-local host should be normalized');
      assert.ok(!serialized.includes('VeryPrivateCorpPassword99'), 'secret in printable .bin body should be scrubbed');
      assert.strictEqual(loaded.hars['admin/pages/sample.har'].log._origin, NEUTRAL_ORIGIN);

      const findings = check(bundleFile, { env: { CORP_PASS: 'VeryPrivateCorpPassword99' } });

      assert.strictEqual(findings.length, 0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
