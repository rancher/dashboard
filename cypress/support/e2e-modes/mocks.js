#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * The integration mocks: the recordings generate mode makes, scrubbed of credentials and packed into one compressed
 * bundle per recording group, `cypress/integration-mocks/<group>.json.br`, so they can be committed and replayed anywhere.
 *
 * `node mocks.js pack <recordings dir> <username> <bundle>` scrubs a recordings directory and packs it
 * `node mocks.js unpack <bundle> <dir>` writes a bundle out as a recordings directory, e.g. to read it
 * `node mocks.js check <bundle>... [--gitleaks <binary>]` fails when a bundle may hold a credential: anything the
 *   scrubber would still remove, the value of any of this process's environment variables that may be a credential
 *   (named like one, or random looking), or anything gitleaks finds
 * `node mocks.js durations <bundle>` prints how long each spec took to record, in seconds
 *
 * Values that appear in the repository's test code or CI workflow are public, so they are kept.
 */

const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PUBLIC_SOURCES = ['cypress/e2e', 'cypress/support', 'cypress/fixtures', '.github/workflows'];
const PUBLIC_EXTENSIONS = /\.(ts|js|json|ya?ml)$/;
const SPEC_ROOT = 'cypress/e2e/tests/';
const BODIES_DIR = 'bodies';
const BUNDLE_VERSION = 1;

/**
 * What a credential is replaced by
 */
const PLACEHOLDER = 'e2e-redacted';
const PLACEHOLDER_B64 = Buffer.from(PLACEHOLDER).toString('base64');

const MIN_SECRET_LENGTH = 8;
const MAX_PATTERN_LENGTH = 1024;
const SECRET_HEADERS = ['authorization', 'proxy-authorization', 'x-api-csrf', 'x-auth-token', 'x-api-key', 'x-api-tunnel-params'];
const COOKIE_HEADERS = ['cookie', 'set-cookie'];
const SECRET_KEYS = /^(password|passwd|currentPassword|newPassword|bootstrapPassword|registryPassword|secret|clientSecret|secretKey|secretAccessKey|aws_secret_access_key|privateKey|private_key|token|accessToken|refreshToken|access_token|refresh_token|id_token|idToken|sessionToken|bearerToken|nodeToken|clusterToken|agentToken|rancherToken|apiKey|api_key|apiToken|registrationToken|kubeconfig|kubeconfigContent|authEncodedJson|serviceAccountKey|signingKey|encryptionKey|caKey|tls\.key|ssh-privatekey|licenseKey|hmac)$/i;
const KUBERNETES_SECRET_TYPES = /^(Opaque$|kubernetes\.io\/|bootstrap\.kubernetes\.io\/|helm\.sh\/|[a-z0-9.-]*cattle\.io\/)/;
const SECRET_HASH_KEYS = /(password|secret|token|key|ca|cert)s?[-_]?hash$/i;
const NOT_A_CREDENTIAL = /^(https?:\/\/|\{\.)/;
const SECRET_TYPES = /^(secret|namespacedsecret|basicauthcredential|namespacedbasicauthcredential|certificate|namespacedcertificate|dockercredential|namespaceddockercredential|sshauth|namespacedsshauth)$/i;
const NEUTRAL_ORIGIN = 'https://e2e-mock.invalid';
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|127\.0\.0\.1\.sslip\.io|e2e-mock\.invalid)$/i;
const PATTERNS = [
  {
    name: 'private key', re: /(-----BEGIN ([A-Z0-9 ]*)PRIVATE KEY( BLOCK)?-----)([\s\S]*?)(-----END \2PRIVATE KEY\3-----)/g, keep: (m, begin, _type, _block, body, end) => `${ begin }\n${ PLACEHOLDER }\n${ end }`, secret: (m, begin, _type, _block, body) => body.trim()
  },
  {
    name: 'yaml private key', re: /(\b(?:client-key-data|private-key|ssh-privatekey)\s*:\s*['"]?)([A-Za-z0-9+/=_-]{20,})(['"]?)/gi, keep: (m, prefix, _val, suffix) => `${ prefix }${ PLACEHOLDER_B64 }${ suffix }`, secret: (m, _prefix, val) => val
  },
  {
    name: 'rancher token', re: /\b((?:token|kubeconfig)-[a-z0-9-]+):([a-z0-9]{40,})\b/g, keep: (m, name) => `${ name }:${ PLACEHOLDER }`, secret: (m, name, key) => key
  },
  { name: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { name: 'github token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/g },
  { name: 'aws access key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: 'slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
];

const isNameLike = (value) => /^[a-z0-9]+([-.][a-z0-9]+)+$/.test(value) && value.split(/[-.]/).filter((part) => /^[a-z]{3,}$/.test(part)).length >= 2;

const entropy = (value) => {
  const counts = {};

  [...value].forEach((c) => {
    counts[c] = (counts[c] || 0) + 1;
  });

  return Object.values(counts).reduce((bits, n) => bits - (n / value.length) * Math.log2(n / value.length), 0);
};

const SECRET_VARIABLE = /TOKEN|SECRET|KEY|PASS|AUTH|CRED|SESSION|COOKIE|PRIVATE|CERT/i;

const secretVariables = (env) => Object.entries(env).filter(([name, value]) => value && value.length >= MIN_SECRET_LENGTH && !isPublic(value) &&
  (SECRET_VARIABLE.test(name) || (value.length >= 16 && !/[\s/:]/.test(value) && entropy(value) >= 3.5)));

const isPlaceholder = (value) => typeof value === 'string' && (value.includes(PLACEHOLDER) || value.includes(PLACEHOLDER_B64));

let publicText;

function publicCorpus() {
  if (publicText === undefined) {
    const parts = [];
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      if (d.name === '__tests__') {
        return;
      }
      const full = path.join(dir, d.name);

      if (d.isDirectory()) {
        walk(full);
      } else if (PUBLIC_EXTENSIONS.test(d.name) && !/\.test\./.test(d.name)) {
        parts.push(fs.readFileSync(full, 'utf8'));
      }
    });

    PUBLIC_SOURCES.map((dir) => path.join(ROOT, dir)).filter((dir) => fs.existsSync(dir)).forEach(walk);
    publicText = parts.join('\n');
  }

  return publicText;
}

const isPrintable = (text) => [...text].every((c) => c === '\t' || c === '\n' || c === '\r' || (c >= ' ' && c <= '~'));

const MIN_NESTED_LENGTH = 40;

const decodeNested = (value) => {
  if (value.length < MIN_NESTED_LENGTH || value.length % 4 === 1 || !/^([A-Za-z0-9+/]+|[A-Za-z0-9_-]+)={0,2}$/.test(value)) {
    return undefined;
  }
  const raw = Buffer.from(value, 'base64');
  const encode = (buffer) => {
    const encoded = buffer.toString(/[-_]/.test(value) ? 'base64url' : 'base64');

    return value.endsWith('=') ? encoded : encoded.replace(/=+$/, '');
  };

  if (raw[0] === 0x1f && raw[1] === 0x8b) {
    try {
      return {
        gzip: true, text: zlib.gunzipSync(raw).toString('utf8'), encode
      };
    } catch {
      return undefined;
    }
  }
  const text = raw.toString('utf8');

  return isPrintable(text) ? {
    gzip: false, text, encode
  } : undefined;
};

const decodeBase64 = (value) => {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0 || value.length < 8) {
    return undefined;
  }
  const decoded = Buffer.from(value, 'base64').toString('utf8');

  return isPrintable(decoded) ? decoded : undefined;
};

const isCertificate = (text) => /^\s*(-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----\s*)+$/.test(text);

const isPublic = (value) => {
  if (value.length < MIN_SECRET_LENGTH || isPlaceholder(value)) {
    return true;
  }
  const corpus = publicCorpus();

  if (corpus.includes(value)) {
    return true;
  }
  const decoded = decodeBase64(value);

  return decoded !== undefined && decoded.length >= 4 && corpus.includes(decoded.trim());
};

class Scrubber {
  constructor() {
    this.found = new Set();
    this.hits = [];
  }

  note(rule, value, where) {
    if (typeof value === 'string' && !isPublic(value)) {
      this.found.add(value);
      this.hits.push({
        rule, where, value
      });

      return true;
    }

    return false;
  }

  text(value, where) {
    let out = value;

    PATTERNS.forEach(({
      name, re, keep, secret
    }) => {
      out = out.replace(re, (...m) => {
        const original = secret ? secret(...m) : m[0];

        if (isPlaceholder(m[0]) || !this.note(name, original, where)) {
          return m[0];
        }

        return keep ? keep(...m) : PLACEHOLDER;
      });
    });

    return out;
  }

  json(value, where, key) {
    if (typeof value === 'string') {
      if (key !== undefined && (SECRET_KEYS.test(key) || SECRET_KEYS.test(key.split('/').pop()) || SECRET_HASH_KEYS.test(key)) && !NOT_A_CREDENTIAL.test(value) && this.note(`${ key } field`, value, where)) {
        return PLACEHOLDER;
      }

      const nested = decodeNested(value);

      if (nested) {
        const hits = this.hits.length;
        const inner = this.body(nested.text, `${ where } (decoded)`);

        if (this.hits.length === hits) {
          return value;
        }
        const buffer = Buffer.from(inner);

        return nested.encode(nested.gzip ? zlib.gzipSync(buffer) : buffer);
      }

      const trimmed = value.trim();

      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);

          if (parsed && typeof parsed === 'object') {
            const hits = this.hits.length;
            const inner = this.json(parsed, `${ where } (json)`);

            if (this.hits.length !== hits) {
              return JSON.stringify(inner);
            }
          }
        } catch {
          // Not valid JSON; fall through to plain text scrubbing
        }
      }

      return this.text(value, where);
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.json(v, where));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }
    const isSecret = value.kind === 'Secret' || (typeof value.type === 'string' && SECRET_TYPES.test(value.type)) ||
      (value.data && typeof value.data === 'object' && [value.type, value._type].some((t) => typeof t === 'string' && KUBERNETES_SECRET_TYPES.test(t)));
    const out = {};

    Object.entries(value).forEach(([k, v]) => {
      if (isSecret && (k === 'data' || k === 'stringData') && v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = {};
        Object.entries(v).forEach(([dk, dv]) => {
          const base64 = k === 'data';

          const certificate = typeof dv === 'string' && isCertificate(base64 ? decodeBase64(dv) || '' : dv);

          out[k][dk] = typeof dv === 'string' && !certificate && this.note(`Secret ${ k }`, dv, where) ? (base64 ? PLACEHOLDER_B64 : PLACEHOLDER) : this.json(dv, where, dk);
          if (base64 && typeof dv === 'string' && out[k][dk] === PLACEHOLDER_B64) {
            const decoded = decodeBase64(dv);

            if (decoded && decoded.length >= MIN_SECRET_LENGTH && !isPublic(decoded)) {
              this.found.add(decoded);
            }
          }
        });
      } else {
        out[k] = this.json(v, where, k);
      }
    });

    return out;
  }

  body(text, where) {
    try {
      return JSON.stringify(this.json(JSON.parse(text), where));
    } catch {
      return this.text(text, where);
    }
  }

  headers(headers, where) {
    return (headers || []).map(({ name, value }) => {
      const lower = name.toLowerCase();

      if (COOKIE_HEADERS.includes(lower)) {
        const separator = lower === 'cookie' ? /;\s*/ : /\n/;
        const cookies = value.split(separator).map((cookie) => {
          const [pair, ...attributes] = cookie.split(';');
          const eq = pair.indexOf('=');

          if (eq < 0) {
            return cookie;
          }
          this.note(`${ lower } header`, pair.substring(eq + 1).trim(), where);

          return [`${ pair.substring(0, eq) }=${ PLACEHOLDER }`, ...attributes].join(';');
        });

        return { name, value: cookies.join(lower === 'cookie' ? '; ' : '\n') };
      }
      if (SECRET_HEADERS.includes(lower)) {
        const [scheme, credential] = value.includes(' ') ? value.split(/ (.*)/s) : [undefined, value];

        this.note(`${ lower } header`, credential, where);

        return { name, value: scheme ? `${ scheme } ${ PLACEHOLDER }` : PLACEHOLDER };
      }

      if (lower === 'location') {
        return { name, value: this.url(value, where) };
      }

      return { name, value: this.text(value, where) };
    });
  }

  url(value, where) {
    if (!value) {
      return value;
    }
    let out = this.text(value, where);
    const q = out.indexOf('?');

    if (q < 0) {
      return out;
    }

    try {
      const parsed = new URL(out, NEUTRAL_ORIGIN);
      let changed = false;

      parsed.searchParams.forEach((v, k) => {
        if ((SECRET_KEYS.test(k) || SECRET_HASH_KEYS.test(k)) && !NOT_A_CREDENTIAL.test(v) && this.note(`${ k } query param`, v, where)) {
          parsed.searchParams.set(k, PLACEHOLDER);
          changed = true;
        }
      });

      if (changed) {
        out = out.startsWith('http://') || out.startsWith('https://') ? parsed.toString() : `${ parsed.pathname }${ parsed.search }${ parsed.hash }`;
      }
    } catch {
      // Malformed URL; already ran text() above
    }

    return out;
  }

  everywhere() {
    const replacements = new Map();

    [...this.found].filter((secret) => !isNameLike(secret)).forEach((secret) => {
      replacements.set(secret, PLACEHOLDER);
      replacements.set(Buffer.from(secret).toString('base64'), PLACEHOLDER_B64);
      replacements.set(Buffer.from(secret).toString('base64').replace(/=+$/, ''), PLACEHOLDER_B64);
      if (isPrintable(secret)) {
        replacements.set(encodeURIComponent(secret), PLACEHOLDER);
      }
      const decoded = decodeBase64(secret);

      if (decoded && decoded.length >= MIN_SECRET_LENGTH && !isPublic(decoded)) {
        replacements.set(decoded, PLACEHOLDER);
      }
    });
    const literals = [...replacements.keys()].filter((s) => s.length >= MIN_SECRET_LENGTH).sort((a, b) => b.length - a.length);
    const long = literals.filter((s) => s.length > MAX_PATTERN_LENGTH);
    const short = literals.filter((s) => s.length <= MAX_PATTERN_LENGTH);
    const chunks = [];

    for (let i = 0; i < short.length; i += 500) {
      chunks.push(new RegExp(short.slice(i, i + 500).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'));
    }

    return (text) => chunks.reduce(
      (out, re) => out.replace(re, (m) => replacements.get(m)),
      long.reduce((out, s) => (out.includes(s) ? out.split(s).join(replacements.get(s)) : out), text)
    );
  }
}

const walkStrings = (value, fn) => {
  if (typeof value === 'string') {
    return fn(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => walkStrings(v, fn));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walkStrings(v, fn)]));
  }

  return value;
};

const scrubFrame = (scrubber, frame, where) => {
  if (frame.opcode === 1) {
    return { ...frame, data: scrubber.body(frame.data, where) };
  }
  if (frame.opcode === 2 && typeof frame.data === 'string') {
    const raw = Buffer.from(frame.data, 'base64').toString('utf8');

    if (raw.length && isPrintable(raw)) {
      const hits = scrubber.hits.length;
      const scrubbed = scrubber.body(raw, `${ where } (ws binary)`);

      if (scrubber.hits.length !== hits) {
        return { ...frame, data: Buffer.from(scrubbed, 'utf8').toString('base64') };
      }
    }
  }

  return frame;
};

const scrubQueryParam = (scrubber, q, where) => {
  if ((SECRET_KEYS.test(q.name) || SECRET_HASH_KEYS.test(q.name)) && !NOT_A_CREDENTIAL.test(q.value) && scrubber.note(`${ q.name } query param`, q.value, where)) {
    return { ...q, value: PLACEHOLDER };
  }

  return { ...q, value: scrubber.text(q.value, where) };
};

const scrubEntry = (scrubber, entry, where) => ({
  ...entry,
  request: {
    ...entry.request,
    url:         scrubber.url(entry.request.url, where),
    headers:     scrubber.headers(entry.request.headers, where),
    queryString: (entry.request.queryString || []).map((q) => scrubQueryParam(scrubber, q, where)),
    ...(entry.request.postData ? { postData: { ...entry.request.postData, text: scrubber.body(entry.request.postData.text || '', where) } } : {}),
  },
  response: {
    ...entry.response,
    headers:     scrubber.headers(entry.response.headers, where),
    redirectURL: scrubber.url(entry.response.redirectURL, where),
    content:     entry.response.content?.text !== undefined ? { ...entry.response.content, text: scrubber.body(entry.response.content.text, where) } : entry.response.content,
  },
  ...(entry._webSocketMessages ? { _webSocketMessages: entry._webSocketMessages.map((f) => scrubFrame(scrubber, f, where)) } : {}),
});

const readTree = (dir, username) => {
  const hars = {};
  const root = path.join(dir, username);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const full = path.join(d, e.name);

    if (e.isDirectory()) {
      walk(full);
    } else if (e.name.endsWith('.har')) {
      hars[path.relative(dir, full).split(path.sep).join('/')] = JSON.parse(fs.readFileSync(full, 'utf8'));
    }
  });

  if (fs.existsSync(root)) {
    walk(root);
  }

  return hars;
};

const readBody = (dir, name) => {
  const file = path.join(dir, BODIES_DIR, name);
  const raw = fs.readFileSync(file);

  return name.endsWith('.gz') ? zlib.gunzipSync(raw) : raw;
};

const isText = (name) => /\.(json|yaml|js|css|html|txt|svg)(\.gz)?$/.test(name);

const isPrintableBuffer = (buf) => {
  if (!buf.length) {
    return false;
  }
  const text = buf.toString('utf8');

  return isPrintable(text);
};

const normalizeOrigins = (hars) => {
  const nonLocal = new Set();

  Object.values(hars).forEach((har) => {
    const origin = har?.log?._origin;

    if (!origin) {
      return;
    }
    try {
      const u = new URL(origin);

      if (!LOCAL_HOST.test(u.hostname)) {
        nonLocal.add(u.origin);
        nonLocal.add(u.host);
        har.log._origin = NEUTRAL_ORIGIN;
      }
    } catch {
      // Ignore invalid origin
    }
  });

  if (!nonLocal.size) {
    return (text) => text;
  }

  const neutralHost = new URL(NEUTRAL_ORIGIN).host;
  const origins = [...nonLocal].sort((a, b) => b.length - a.length);

  return (text) => origins.reduce((out, item) => out.split(item).join(item.includes('://') ? NEUTRAL_ORIGIN : neutralHost), text);
};

/**
 * Scrubs the recordings of one user in a recordings directory, returning the bundle to write
 */
function scrub(dir, username, extraSecrets = []) {
  const scrubber = new Scrubber();
  const hars = readTree(dir, username);
  const bodies = {};
  const renamed = new Map();
  const scrubOrigin = normalizeOrigins(hars);

  extraSecrets.filter((s) => s && !isPublic(s)).forEach((s) => scrubber.found.add(s));

  Object.entries(hars).forEach(([file, har]) => {
    har.log.entries = har.log.entries.map((entry, i) => {
      const where = `${ file } entry ${ i }`;
      const name = entry.response.content?._file;

      if (name && !renamed.has(name)) {
        const raw = readBody(dir, name);
        const text = isText(name) || isPrintableBuffer(raw);

        renamed.set(name, {
          where, data: text ? scrubber.body(raw.toString('utf8'), `${ where } body`) : raw.toString('base64'), text
        });
      }

      return scrubEntry(scrubber, entry, where);
    });
  });

  const everywhere = scrubber.everywhere();
  const finalize = (text) => scrubOrigin(everywhere(text));
  const names = new Map();

  renamed.forEach(({ data, text }, name) => {
    const content = text ? finalize(data) : data;
    const ext = name.replace(/\.gz$/, '').split('.').pop();
    const sha = crypto.createHash('sha1').update(content).digest('hex');
    const scrubbedName = `${ sha.substring(0, 2) }/${ sha }.${ ext }`;

    bodies[scrubbedName] = { text, data: content };
    names.set(name, scrubbedName);
  });
  Object.values(hars).forEach((har) => har.log.entries.forEach((entry) => {
    if (entry.response.content?._file) {
      entry.response.content._file = names.get(entry.response.content._file);
    }
  }));
  const scrubbedHars = walkStrings(hars, finalize);

  return {
    bundle: {
      version: BUNDLE_VERSION, username, hars: scrubbedHars, bodies
    },
    removed: scrubber.hits.length,
    rules:   scrubber.hits.reduce((all, h) => ({ ...all, [h.rule]: (all[h.rule] || 0) + 1 }), {}),
  };
}

const writeBundle = (bundle, file) => {
  const json = Buffer.from(JSON.stringify(bundle));

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, zlib.brotliCompressSync(json, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]:   9,
      [zlib.constants.BROTLI_PARAM_LGWIN]:     24,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: json.length,
    }
  }));

  return json.length;
};

/**
 * Reads a bundle written by `pack`
 */
function readBundle(file) {
  const bundle = JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(file)).toString('utf8'));

  if (bundle.version !== BUNDLE_VERSION) {
    throw new Error(`${ file } is a version ${ bundle.version } bundle, expected ${ BUNDLE_VERSION }`);
  }

  return bundle;
}

/**
 * Writes bundles out as a recordings directory, which the record/replay server reads. Where two bundles hold the same
 * spec, the one with more tests is kept
 */
function unpack(files, dir) {
  const pages = new Map();

  files.forEach((file) => {
    const bundle = readBundle(file);

    Object.entries(bundle.hars).forEach(([rel, har]) => {
      const target = path.join(dir, rel);

      if ((pages.get(target) || -1) >= har.log.pages.length) {
        return;
      }
      pages.set(target, har.log.pages.length);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, JSON.stringify(har));
    });
    Object.entries(bundle.bodies).forEach(([name, { text, data }]) => {
      const target = path.join(dir, BODIES_DIR, name);

      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, text ? data : Buffer.from(data, 'base64'));
    });
  });

  return dir;
}

/**
 * The record/replay server's view of a live request body, so it compares like with like against scrubbed recordings
 */
function scrubRequestBody(text) {
  return new Scrubber().body(text, 'request');
}

const variants = (value) => [value, JSON.stringify(value).slice(1, -1), encodeURIComponent(value), Buffer.from(value).toString('base64'), Buffer.from(value).toString('base64url')]
  .filter((v, i, all) => all.indexOf(v) === i);

/**
 * Everything that would make a bundle unsafe to publish
 */
function check(file, { env = process.env, gitleaks } = {}) {
  const findings = [];
  const bundle = readBundle(file);
  const texts = [
    ...Object.entries(bundle.hars).map(([rel, har]) => [rel, JSON.stringify(har)]),
    ...Object.entries(bundle.bodies).map(([name, { text, data }]) => [`${ BODIES_DIR }/${ name }`, text ? data : Buffer.from(data, 'base64').toString('latin1')]),
  ];
  const scrubber = new Scrubber();

  Object.entries(bundle.hars).forEach(([rel, har]) => har.log.entries.forEach((entry, i) => scrubEntry(scrubber, entry, `${ rel } entry ${ i }`)));
  Object.entries(bundle.bodies).forEach(([name, { text, data }]) => text && scrubber.body(data, `${ BODIES_DIR }/${ name }`));
  scrubber.hits.forEach(({ rule, where, value }) => findings.push({
    check: 'scrubber', rule, where, length: value.length
  }));

  secretVariables(env).forEach(([name, value]) => {
    variants(value).forEach((form) => texts.filter(([, text]) => text.includes(form)).forEach(([where]) => findings.push({
      check: 'environment', rule: `value of $${ name }`, where, length: value.length
    })));
  });

  if (gitleaks) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-mocks-check-'));
    const report = path.join(dir, 'report.json');

    unpack([file], path.join(dir, 'files'));
    try {
      execFileSync(gitleaks, ['dir', path.join(dir, 'files'), '--no-banner', '--report-format', 'json', '--report-path', report, '--exit-code', '0'], { stdio: ['ignore', 'ignore', 'inherit'] });
      JSON.parse(fs.readFileSync(report, 'utf8'))
        .filter((f) => {
          const text = fs.readFileSync(f.File, 'utf8');
          const value = enclosingString(text, f.Secret || f.Match);

          return !isPublic(value) && !isAddonChecksum(text, value);
        })
        .forEach((f) => findings.push({
          check: 'gitleaks', rule: f.RuleID, where: `${ path.relative(path.join(dir, 'files'), f.File) }:${ f.StartLine }`, length: (f.Secret || f.Match).length
        }));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  return findings;
}

const enclosingString = (text, part) => {
  const at = text.indexOf(part);

  if (at < 0) {
    return part;
  }
  const start = text.lastIndexOf('"', at);
  const end = text.indexOf('"', at + part.length);

  return start < 0 || end < 0 ? part : text.substring(start + 1, end);
};

const isAddonChecksum = (text, value) => /^[0-9a-f]{64}$/.test(value) && text.includes(`"checksum":"${ value }"`) && text.includes('"type":"k3s.cattle.io.addon"');

const recordedSeconds = (har) => {
  const { entries } = har.log;
  const start = entries.reduce((min, e) => Math.min(min, Date.parse(e.startedDateTime)), Infinity);
  const end = entries.reduce((max, e) => Math.max(max, Date.parse(e.startedDateTime) + (e.time || 0)), -Infinity);

  return entries.length ? Math.round((end - start) / 1000) : undefined;
};

/**
 * How long each spec in a bundle took to record, in seconds, by spec path
 */
function durations(file) {
  const bundle = readBundle(file);

  return Object.fromEntries(Object.entries(bundle.hars)
    .map(([rel, har]) => [`${ SPEC_ROOT }${ rel.split('/').slice(1).join('/').replace(/\.har$/, '') }.spec.ts`, recordedSeconds(har)])
    .filter(([, seconds]) => seconds !== undefined));
}

module.exports = {
  PLACEHOLDER, PLACEHOLDER_B64, NEUTRAL_ORIGIN, Scrubber, scrubEntry, scrub, writeBundle, readBundle, unpack, scrubRequestBody, check, durations
};

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  const option = (name) => {
    const i = args.indexOf(name);

    return i < 0 ? undefined : args.splice(i, 2)[1];
  };

  if (command === 'pack') {
    const [dir, username, file] = args;
    const { bundle, removed, rules } = scrub(dir, username, secretVariables(process.env).map(([, value]) => value));
    const size = writeBundle(bundle, file);

    console.log(`${ file }: ${ Object.keys(bundle.hars).length } specs, ${ Object.keys(bundle.bodies).length } bodies, ${ (size / 1e6).toFixed(1) } MB packed to ${ (fs.statSync(file).size / 1e6).toFixed(1) } MB; removed ${ removed } credentials ${ JSON.stringify(rules) }`);
  } else if (command === 'unpack') {
    console.log(unpack([args[0]], args[1]));
  } else if (command === 'check') {
    const gitleaks = option('--gitleaks');
    let total = 0;

    console.log(`Environment variables that may be credentials: ${ secretVariables(process.env).map(([name]) => name).join(', ') || 'none' }`);

    args.forEach((file) => {
      const findings = check(file, { gitleaks });

      total += findings.length;
      findings.forEach((f) => console.log(`${ file }: ${ f.check } ${ f.rule } at ${ f.where } (${ f.length } characters)`));
      console.log(`${ file }: ${ findings.length ? `${ findings.length } findings` : 'clean' }${ gitleaks ? '' : ' (gitleaks not run)' }`);
    });
    process.exitCode = total ? 1 : 0;
  } else if (command === 'durations') {
    console.log(JSON.stringify(durations(args[0]), null, 2));
  } else {
    console.error('Usage: mocks.js pack <recordings dir> <username> <bundle> | unpack <bundle> <dir> | check <bundle>... [--gitleaks <binary>] | durations <bundle>');
    process.exitCode = 1;
  }
}
