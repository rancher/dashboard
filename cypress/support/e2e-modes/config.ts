import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { E2E_MODES, E2EMode } from './modes';
import { RecordingStore } from './recordings';
import { RecordReplayServer } from './server';

export interface E2EModeUrls {
  baseUrl: string;
  api: string;
  /** Where the record/replay server listens (generate and integration modes) */
  origin?: string;
  /** The Rancher the record/replay server forwards to (generate mode) */
  upstream?: string;
}

export function e2eModeFromEnv(env: NodeJS.ProcessEnv): E2EMode {
  const mode = (env.TEST_MODE || 'full').trim().toLowerCase() as E2EMode;

  if (!E2E_MODES.includes(mode)) {
    throw new Error(`Unknown TEST_MODE '${ env.TEST_MODE }', expected one of: ${ E2E_MODES.join(', ') }`);
  }

  return mode;
}

/**
 * In generate and integration modes the tests talk to the record/replay server instead of Rancher. It listens on the
 * host the tests would have used, on port TEST_PROXY_PORT (default 8443)
 */
export function e2eModeUrls(mode: E2EMode, baseUrl: string, api: string, env: NodeJS.ProcessEnv): E2EModeUrls {
  if (mode === 'full') {
    return { baseUrl, api };
  }

  const base = new URL(baseUrl);
  const origin = `https://${ base.hostname }:${ env.TEST_PROXY_PORT || '8443' }`;

  return {
    baseUrl:  `${ origin }${ base.pathname.replace(/\/$/, '') }`,
    api:      origin,
    origin,
    upstream: mode === 'generate' ? api : undefined,
  };
}

/**
 * The recordings to write to, or replay first: TEST_RECORDING_SET, else the user the tests run as
 */
export function e2eRecordingSet(env: NodeJS.ProcessEnv, username: string): string {
  return (env.TEST_RECORDING_SET || username).replace(/[^a-zA-Z0-9_.-]+/g, '-');
}

const MOCKS_DIR = path.join('cypress', 'integration-mocks');
const BUNDLE = /\.json\.br$/;

const unpackedBundles = (bundles: string[]): string => {
  const { unpack } = require('./mocks');
  const id = crypto.createHash('sha1').update(bundles.map((b) => `${ b }:${ fs.statSync(b).size }:${ fs.statSync(b).mtimeMs }`).join('\n')).digest('hex');
  const dir = path.join(os.tmpdir(), `e2e-mocks-${ id.substring(0, 12) }`);
  const done = path.join(dir, '.unpacked');

  if (!fs.existsSync(done)) {
    fs.rmSync(dir, { recursive: true, force: true });
    unpack(bundles, dir);
    fs.writeFileSync(done, bundles.join('\n'));
  }

  return dir;
};

/**
 * Where generate mode writes recordings (TEST_RECORDINGS_DIR, default cypress/recordings) and integration mode replays
 * them from: the committed mocks in cypress/integration-mocks, unless TEST_RECORDINGS_DIR names a recordings directory,
 * a directory of mock bundles or one bundle
 */
export function e2eRecordingsDir(mode: E2EMode, env: NodeJS.ProcessEnv, projectRoot: string, set: string): string {
  const configured = env.TEST_RECORDINGS_DIR ? path.resolve(projectRoot, env.TEST_RECORDINGS_DIR) : undefined;

  if (mode !== 'integration') {
    return configured || path.resolve(projectRoot, 'cypress', 'recordings');
  }

  const source = configured || path.resolve(projectRoot, MOCKS_DIR);

  if (BUNDLE.test(source)) {
    return fs.existsSync(source) ? unpackedBundles([source]) : source;
  }

  const bundles = fs.existsSync(source) && fs.statSync(source).isDirectory() ? fs.readdirSync(source).filter((f) => BUNDLE.test(f) && f.startsWith(`${ set }@`)).sort().map((f) => path.join(source, f)) : [];

  return bundles.length ? unpackedBundles(bundles) : source;
}

const firstExisting = (paths: string[]) => paths.find((p) => fs.existsSync(p));

/**
 * Start the record/replay server for generate and integration modes, returning the Cypress tasks it needs
 */
export async function startE2EModeServer(mode: E2EMode, urls: E2EModeUrls, env: NodeJS.ProcessEnv, projectRoot: string, username: string): Promise<RecordReplayServer | undefined> {
  if (mode === 'full' || !urls.origin) {
    return undefined;
  }

  const certDirs = [path.join(projectRoot, 'shell', 'server'), path.join(projectRoot, 'node_modules', '@rancher', 'shell', 'server')];
  const key = env.TEST_PROXY_KEY || firstExisting(certDirs.map((d) => path.join(d, 'server.key')));
  const cert = env.TEST_PROXY_CERT || firstExisting(certDirs.map((d) => path.join(d, 'server.crt')));

  if (!key || !cert) {
    throw new Error(`TEST_MODE=${ mode } needs a TLS key and certificate, set TEST_PROXY_KEY and TEST_PROXY_CERT`);
  }

  const distDir = firstExisting([
    env.TEST_DIST_DIR || '',
    path.join(projectRoot, env.E2E_BUILD_DIST_DIR || 'dist'),
  ].filter((d) => !!d && fs.existsSync(path.join(d, 'index.html'))));

  if (mode === 'integration' && !distDir) {
    throw new Error('TEST_MODE=integration serves the dashboard from a build, set TEST_DIST_DIR to one (see `yarn e2e:build`)');
  }

  const server = new RecordReplayServer({
    mode,
    origin:   urls.origin,
    upstream: urls.upstream,
    store:    new RecordingStore(e2eRecordingsDir(mode, env, projectRoot, e2eRecordingSet(env, username))),
    set:      e2eRecordingSet(env, username),
    distDir,
    key:      fs.readFileSync(key),
    cert:     fs.readFileSync(cert),
  });

  await server.start();

  return server;
}
