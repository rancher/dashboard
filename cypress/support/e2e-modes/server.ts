/* eslint-disable no-console */
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { Duplex } from 'stream';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import {
  BEFORE_ALL_SCOPE, E2E_MODE_TASKS, E2EModeTestEnd, E2EModeTestEndResult, E2EModeTestStart
} from './modes';
import {
  emptyHar, HarEntry, HarNameValue, HarWebSocketMessage, RecordingStore
} from './recordings';

export interface RecordReplayServerOptions {
  mode: 'generate' | 'integration';
  /** Where the tests reach this server, e.g. https://127.0.0.1.sslip.io:8443 */
  origin: string;
  /** The Rancher to forward requests to (generate mode) */
  upstream?: string;
  store: RecordingStore;
  /** The recordings to write to (generate) or to replay first (integration) */
  set: string;
  /** A dashboard build to serve /dashboard/ from. Without one, generate mode forwards /dashboard/ to the upstream Rancher */
  distDir?: string;
  key: Buffer;
  cert: Buffer;
}

interface Recorded {
  entry: HarEntry;
  body?: Buffer;
}

interface RecordedSocket {
  url: URL;
  scope: Scope;
  entry: HarEntry;
  openedAt: number;
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const PREFERENCE_SAVES = [/^\/v1\/userpreferences/, /^\/v3\/preferences/];
const EPOCH_MS = /(?<![\d.])1[5-9]\d{11,}(?![\d.])/g;
const HOP_BY_HOP = ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade'];
const NOT_FORWARDED = [...HOP_BY_HOP, 'host', 'accept-encoding', 'if-none-match', 'if-modified-since'];
const NOT_REPLAYED = [...HOP_BY_HOP, 'content-length', 'content-encoding', 'date'];
const NOT_RECORDED = [
  ...NOT_REPLAYED, 'content-security-policy', 'x-content-type-options', 'strict-transport-security', 'expires', 'audit-id',
  'x-kubernetes-pf-flowschema-uid', 'x-kubernetes-pf-prioritylevel-uid'
];
const TEXT = /json|javascript|text|html|xml|yaml|svg/;
const MAX_TEXT = 1024 * 1024;
const MAX_FRAME_DELAY = 1500;
const MAX_ATTEMPTS = 5;
const FRAME_ANCHOR_TIMEOUT = 5000;
const PING_INTERVAL = 10000;
const ANSWERED_FRAMES = ['ping', 'resource.start', 'resource.stop', 'resource.error'];
const WATCH_FIELDS = ['resourceType', 'id', 'namespace', 'selector', 'mode', 'debounceMs'];
const SOCKET = 'WS';
const UNSCOPED = 'unscoped';
const SOCKET_CONTINUED = 'WS+';

const ASSET_TYPES: { [ext: string]: string } = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.mjs':   'application/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.map':   'application/json',
  '.json':  'application/json',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.gif':   'image/gif',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.eot':   'application/vnd.ms-fontobject',
  '.txt':   'text/plain; charset=utf-8',
};

const isMutation = (method: string, pathname: string) => !SAFE_METHODS.includes(method) && !PREFERENCE_SAVES.some((r) => r.test(pathname));
const isText = (mimeType: string) => TEXT.test(mimeType);
const decode = (text: string) => {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    return text;
  }
};
const keyFor = (method: string, pathAndQuery: string) => `${ method } ${ decode(pathAndQuery).replace(EPOCH_MS, '{ts}').replace(/[?&]revision=\d+/, '') }`;
const pathKey = (method: string, pathAndQuery: string) => keyFor(method, pathAndQuery.split('?')[0]);
const queryOf = (pathAndQuery: string) => (pathAndQuery.split('?')[1] || '').split('&').filter((p) => !!p).map((p) => decode(p).replace(EPOCH_MS, '{ts}'));
const pathOf = (url: string) => {
  const u = new URL(url);

  return `${ u.pathname }${ u.search }`;
};
const timestamps = (text: string) => Array.from(text.matchAll(EPOCH_MS)).map((m) => m[0]);
const toBuffer = (data: RawData): Buffer => (Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data as Buffer));
const closeCode = (code: number) => ((!code || code === 1005 || code === 1006) ? 1000 : code);

const frameJson = (frame: HarWebSocketMessage): any => {
  if (frame.opcode !== 1) {
    return undefined;
  }

  try {
    return JSON.parse(frame.data);
  } catch (e) {
    return undefined;
  }
};

const headerList = (headers: http.IncomingHttpHeaders, exclude: string[]): HarNameValue[] => {
  const list: HarNameValue[] = [];

  Object.entries(headers).forEach(([name, value]) => {
    if (value === undefined || exclude.includes(name.toLowerCase())) {
      return;
    }

    (Array.isArray(value) ? value : [value]).forEach((v) => list.push({ name, value: `${ v }` }));
  });

  return list;
};

const REVISION = '{revision}';

const canonicalBody = (entry: HarEntry, body: Buffer): Buffer => {
  if (!/json/.test(entry.response.content.mimeType)) {
    return body;
  }

  let text = body.toString('utf8');

  if (/\/schemas$/.test(new URL(entry.request.url).pathname)) {
    try {
      const json = JSON.parse(text);

      if (Array.isArray(json?.data)) {
        json.data.sort((a: any, b: any) => (`${ a?.id }` < `${ b?.id }` ? -1 : 1));
        text = JSON.stringify(json);
      }
    } catch (e) {}
  }

  const dataAt = text.indexOf('"data":[');
  const head = dataAt >= 0 ? text.substring(0, dataAt) : '';
  const revision = head.match(/"revision":"(\d+)"/);

  if (revision) {
    entry.response.content._revision = revision[1];
    text = `${ head.replace(revision[0], `"revision":"${ REVISION }"`) }${ text.substring(dataAt) }`;
  }

  return Buffer.from(text);
};

class Scope {
  readonly startedAt = Date.now();
  readonly recorded: Recorded[] = [];
  readonly misses: string[] = [];
  readonly served = new Map<string, number>();
  readonly listeners = new Set<() => void>();
  readonly writes = new Map<string, number>();
  readonly writtenAt = new Map<string, number>();
  lastWrite?: { anchor: string, at: number };
  mutations = 0;
  closed = false;

  constructor(public readonly name: string, public readonly isTest = false) {}

  start(key: string, method: string) {
    if (SAFE_METHODS.includes(method)) {
      return;
    }

    const count = (this.writes.get(key) || 0) + 1;
    const anchor = `${ key }#${ count }`;
    const at = Date.now();

    this.writes.set(key, count);
    this.writtenAt.set(anchor, at);
    this.lastWrite = { anchor, at };
    this.listeners.forEach((listener) => listener());
  }

  complete(method: string, pathname: string) {
    if (isMutation(method, pathname)) {
      this.mutations++;
      this.listeners.forEach((listener) => listener());
    }
  }

  close() {
    this.closed = true;
    this.listeners.clear();
  }
}

class Spec {
  readonly committed = new Map<string, Scope>();
  readonly byScope = new Map<string, Map<string, HarEntry[]>>();
  readonly all = new Map<string, HarEntry[]>();
  readonly byPath = new Map<string, HarEntry[]>();
  readonly others = new Map<string, HarEntry[]>();
  readonly aliases = new Map<string, string>();
  replayed = 0;
  missed = 0;

  constructor(public readonly name: string) {}
}

const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
  const list = map.get(key);

  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
};

class SocketReplay {
  private readonly watched = new Set<string>();
  private readonly ping?: NodeJS.Timeout;
  private frames: HarWebSocketMessage[] = [];
  private entry?: HarEntry;
  private openedAt = Date.now();
  private timer?: NodeJS.Timeout;
  private next = 0;
  private nextSince = Date.now();

  constructor(
    private readonly client: WebSocket,
    public readonly url: URL,
    private scope: Scope,
    entry: HarEntry | undefined,
    private readonly subscribe: boolean,
    private readonly steve: boolean,
    private readonly rewrite: (text: string, entry?: HarEntry) => string,
    onClose: () => void,
  ) {
    if (subscribe) {
      const recordedPing = entry?._webSocketMessages?.find((m) => m.type === 'receive' && frameJson(m)?.name === 'ping');

      this.ping = setInterval(() => this.send(recordedPing?.data || '{"name":"ping","data":{}}'), PING_INTERVAL);
    }

    client.on('message', (data, isBinary) => this.onClientMessage(data, isBinary));
    client.on('close', () => {
      this.close();
      onClose();
    });
    client.on('error', () => this.stop());
    this.switchScope(scope, entry);
  }

  switchScope(scope: Scope, entry: HarEntry | undefined) {
    const messages = (entry?._webSocketMessages || []).filter((m) => m.type === 'receive');

    this.stop();
    this.scope = scope;
    this.entry = entry;
    this.frames = this.subscribe ? messages.filter((m) => !ANSWERED_FRAMES.includes(frameJson(m)?.name)) : messages;
    this.next = 0;
    this.openedAt = Date.now();
    this.nextSince = this.openedAt;
    scope.listeners.add(this.pump);
    this.pump();
  }

  private send(data: string | Buffer) {
    if (this.client.readyState === WebSocket.OPEN) {
      this.client.send(data);
    }
  }

  private onClientMessage(data: RawData, isBinary: boolean) {
    if (!this.steve || isBinary) {
      return;
    }

    let msg: any;

    try {
      msg = JSON.parse(toBuffer(data).toString('utf8'));
    } catch (e) {
      return;
    }

    if (!msg?.resourceType) {
      return;
    }

    const echo: { [key: string]: any } = {};

    WATCH_FIELDS.forEach((field) => {
      if (msg[field] !== undefined) {
        echo[field] = msg[field];
      }
    });

    if (msg.stop) {
      this.watched.delete(msg.resourceType);
      this.send(JSON.stringify({ name: 'resource.stop', ...echo }));
    } else {
      this.watched.add(msg.resourceType);
      this.send(JSON.stringify({ name: 'resource.start', ...echo }));
      this.pump();
    }
  }

  private pump = () => {
    clearTimeout(this.timer);

    while (this.next < this.frames.length) {
      const frame = this.frames[this.next];
      const now = Date.now();
      let after = frame._after ? this.scope.writtenAt.get(frame._after) : this.openedAt;

      if (after === undefined) {
        const giveUp = this.nextSince + FRAME_ANCHOR_TIMEOUT;

        if (now < giveUp) {
          this.timer = setTimeout(this.pump, giveUp - now);

          return;
        }
        after = now;
      }

      const wait = Math.max(after, this.openedAt) + Math.min(frame._since, MAX_FRAME_DELAY) - now;

      if (wait > 0) {
        this.timer = setTimeout(this.pump, wait);

        return;
      }

      this.next++;
      this.nextSince = now;

      const type = this.steve ? frameJson(frame)?.resourceType : undefined;

      if (!type || this.watched.has(type)) {
        this.send(frame.opcode === 2 ? Buffer.from(frame.data, 'base64') : this.rewrite(frame.data, this.entry));
      }
    }
  };

  private stop() {
    clearTimeout(this.timer);
    this.scope.listeners.delete(this.pump);
  }

  close() {
    this.stop();
    clearInterval(this.ping);
  }
}

/**
 * The server the tests talk to in generate and integration modes.
 *
 * - `/dashboard/` is the dashboard build under test
 * - generate: everything else is forwarded to Rancher, and the requests and responses of each passing test are recorded
 * - integration: everything else is answered from the recordings, no Rancher is needed
 *
 * Cypress tasks (`tasks()`) tell it which spec and test is running.
 */
export class RecordReplayServer {
  private server?: https.Server;
  private readonly wss = new WebSocketServer({
    noServer:          true,
    perMessageDeflate: false,
    handleProtocols:   (protocols) => protocols.values().next().value || false,
  });

  private spec?: Spec;
  private scope = new Scope(UNSCOPED);
  private readonly origins = new WeakMap<HarEntry, string>();
  private readonly recordedSockets = new Set<RecordedSocket>();
  private readonly replayedSockets = new Set<SocketReplay>();
  private globalIndex?: Map<string, HarEntry>;

  constructor(private readonly options: RecordReplayServerOptions) {}

  get origin(): string {
    return this.options.origin;
  }

  private get host(): string {
    return new URL(this.origin).host;
  }

  start(): Promise<void> {
    const server = https.createServer({ key: this.options.key, cert: this.options.cert }, (req, res) => {
      this.onRequest(req, res).catch((e) => {
        console.error('[e2e mode] request failed', req.method, req.url, e);
        if (!res.headersSent) {
          res.writeHead(500);
        }
        res.end();
      });
    });

    server.on('upgrade', (req, socket, head) => this.onUpgrade(req, socket, head));
    this.server = server;

    return new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(parseInt(new URL(this.origin).port, 10), () => {
        console.log(`[e2e ${ this.options.mode }] listening on ${ this.origin }${ this.options.upstream ? `, forwarding to ${ this.options.upstream }` : '' }`);
        console.log(`[e2e ${ this.options.mode }] recordings: ${ path.join(this.options.store.dir, this.options.set) }`);
        resolve();
      });
    });
  }

  stop() {
    this.server?.close();
    this.wss.close();
  }

  /**
   * The Cypress tasks the browser side calls, see `hooks.ts`
   */
  tasks() {
    return {
      [E2E_MODE_TASKS.specStart]: ({ spec }: { spec: string }) => {
        this.startSpec(spec);

        return null;
      },
      [E2E_MODE_TASKS.testStart]: ({ spec, title }: E2EModeTestStart) => {
        if (this.spec?.name !== spec) {
          this.startSpec(spec);
        }
        this.startScope(new Scope(title, true));

        return null;
      },
      [E2E_MODE_TASKS.testEnd]: ({ title, passed }: E2EModeTestEnd): E2EModeTestEndResult => {
        const scope = this.scope;

        if (passed && scope.name === title) {
          this.spec?.committed.set(scope.name, scope);
        }
        this.startScope(new Scope(`after: ${ title }`));

        return { misses: scope.misses };
      },
      [E2E_MODE_TASKS.specEnd]: ({ spec }: { spec: string }) => {
        if (this.spec?.name === spec) {
          this.endSpec();
        }

        return null;
      },
    };
  }

  /**
   * Make sure what a spec recorded is written, even if its `after` hooks did not run
   */
  afterSpec(spec: string) {
    if (this.spec?.name === spec) {
      this.endSpec();
    }
  }

  private startSpec(name: string) {
    if (this.spec) {
      this.endSpec();
    }

    const spec = new Spec(name);

    if (this.options.mode === 'integration') {
      const { store, set } = this.options;
      const own = store.read(set, name);

      own?.log.entries.forEach((entry) => {
        const key = this.entryKey(entry);
        const scoped = spec.byScope.get(entry.pageref) || new Map<string, HarEntry[]>();

        this.origins.set(entry, own.log._origin);
        push(spec.all, key, entry);
        push(spec.byPath, pathKey(entry.request.method, pathOf(entry.request.url)), entry);
        push(scoped, key, entry);
        spec.byScope.set(entry.pageref, scoped);
      });

      store.sets().filter((s) => s !== set).forEach((other) => {
        const har = store.read(other, name);

        har?.log.entries.forEach((entry) => {
          this.origins.set(entry, har.log._origin);
          push(spec.others, this.entryKey(entry), entry);
        });
      });

      if (!own) {
        console.log(`[e2e integration] ${ name }: no recordings in set '${ set }'`);
      }
    }

    this.spec = spec;
    this.startScope(new Scope(BEFORE_ALL_SCOPE));
  }

  private startScope(scope: Scope) {
    const previous = this.scope;

    previous.close();
    if (!previous.isTest && previous.name !== UNSCOPED && previous.recorded.length) {
      this.spec?.committed.set(previous.name, previous);
    }
    this.scope = scope;

    this.recordedSockets.forEach((socket) => {
      socket.scope = scope;
      socket.openedAt = scope.startedAt;
      socket.entry = this.socketEntry(socket.url, scope, true);
      scope.recorded.push({ entry: socket.entry });
    });

    this.replayedSockets.forEach((socket) => {
      const continued = this.spec?.byScope.get(scope.name)?.get(keyFor(SOCKET_CONTINUED, `${ socket.url.pathname }${ socket.url.search }`));

      socket.switchScope(scope, continued?.length ? this.pick(continued, scope, SOCKET_CONTINUED) : undefined);
    });
  }

  private endSpec() {
    const spec = this.spec;

    this.startScope(new Scope(UNSCOPED));
    this.spec = undefined;

    if (!spec) {
      return;
    }

    if (this.options.mode === 'integration') {
      console.log(`[e2e integration] ${ spec.name }: ${ spec.replayed } replayed, ${ spec.missed } without a recording`);

      return;
    }

    if (!spec.committed.size) {
      console.log(`[e2e generate] ${ spec.name }: nothing to record`);

      return;
    }

    const { store, set } = this.options;
    const har = store.read(set, spec.name) || emptyHar(this.origin);
    const ids = new Set(spec.committed.keys());
    let count = 0;

    har.log._origin = this.origin;
    har.log.pages = har.log.pages.filter((p) => !ids.has(p.id));
    har.log.entries = har.log.entries.filter((e) => !ids.has(e.pageref));

    spec.committed.forEach((scope) => {
      har.log.pages.push({
        startedDateTime: new Date(scope.startedAt).toISOString(),
        id:              scope.name,
        title:           scope.name,
        pageTimings:     {},
      });

      scope.recorded.forEach(({ entry, body }) => {
        if (entry._continuation && !entry._webSocketMessages?.length) {
          return;
        }
        if (body?.length) {
          entry.response.content._file = store.writeBody(canonicalBody(entry, body), entry.response.content.mimeType);
        }
        har.log.entries.push(entry);
        count++;
      });
    });

    store.write(set, spec.name, har);
    console.log(`[e2e generate] ${ spec.name }: recorded ${ count } requests in ${ ids.size } tests and hooks`);
  }

  private entryKey(entry: HarEntry): string {
    const method = entry._resourceType === 'websocket' ? (entry._continuation ? SOCKET_CONTINUED : SOCKET) : entry.request.method;

    return keyFor(method, pathOf(entry.request.url));
  }

  private async onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const url = new URL(req.url || '/', this.origin);
    const body = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    if (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/')) {
      if (this.options.distDir) {
        return this.serveDashboard(url, res);
      }
      if (this.options.mode === 'generate') {
        return this.forward(req, res, url, body, false);
      }
    }

    if (this.options.mode === 'generate') {
      return this.forward(req, res, url, body, true);
    }

    return this.replay(req, res, url, body);
  }

  private serveDashboard(url: URL, res: http.ServerResponse) {
    if (url.pathname === '/dashboard') {
      res.writeHead(302, { location: `/dashboard/${ url.search }` });

      return res.end();
    }

    const root = path.resolve(this.options.distDir as string);
    const relative = decodeURIComponent(url.pathname).replace(/^\/dashboard\/?/, '');
    let file = path.resolve(root, relative);

    if (!file.startsWith(root)) {
      res.writeHead(403);

      return res.end();
    }

    if (!relative || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const ext = path.extname(relative);

      if (ext && ext !== '.html' && ASSET_TYPES[ext]) {
        res.writeHead(404);

        return res.end();
      }
      file = path.join(root, 'index.html');
    }

    const ext = path.extname(file);

    res.writeHead(200, {
      'content-type':  ASSET_TYPES[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    fs.createReadStream(file).pipe(res);
  }

  private forward(req: http.IncomingMessage, res: http.ServerResponse, url: URL, body: Buffer, record: boolean) {
    const upstream = new URL(this.options.upstream as string);
    const target = new URL(`${ url.pathname }${ url.search }`, upstream);
    const method = req.method || 'GET';
    const scope = this.scope;
    const mutations = scope.mutations;
    const started = Date.now();
    const headers: http.OutgoingHttpHeaders = {};

    Object.entries(req.headers).forEach(([name, value]) => {
      if (!NOT_FORWARDED.includes(name)) {
        headers[name] = value;
      }
    });
    headers.host = target.host;
    headers['x-api-host'] = this.host;
    headers['x-forwarded-host'] = this.host;
    headers['x-forwarded-proto'] = 'https';

    const lib = target.protocol === 'http:' ? http : https;

    if (record) {
      scope.start(keyFor(method, `${ url.pathname }${ url.search }`), method);
    }

    const send = (attempt: number) => {
      const upReq = lib.request(target, {
        method, headers, rejectUnauthorized: false, agent: false
      }, (upRes) => {
        const status = upRes.statusCode || 502;
        const responseHeaders: http.OutgoingHttpHeaders = {};

        Object.entries(upRes.headers).forEach(([name, value]) => {
          if (!HOP_BY_HOP.includes(name)) {
            responseHeaders[name] = name === 'location' && typeof value === 'string' ? value.replace(upstream.origin, this.origin) : value;
          }
        });

        res.writeHead(status, upRes.statusMessage, responseHeaders);

        const chunks: Buffer[] = [];

        upRes.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          res.write(chunk);
        });
        upRes.on('end', () => {
          res.end();

          const responseBody = Buffer.concat(chunks);

          if (record && !scope.closed) {
            scope.recorded.push({
              entry: this.entry({
                scope, method, url, req, body, status, statusText: upRes.statusMessage || '', resHeaders: upRes.headers, responseBody, started, mutations
              }),
              body: responseBody,
            });
          }

          if (record) {
            scope.complete(method, url.pathname);
          }
        });
        upRes.on('error', () => res.destroy());
      });

      res.once('close', () => {
        if (!res.writableEnded) {
          upReq.destroy();
        }
      });
      upReq.on('error', (e) => {
        if (!res.headersSent && !res.destroyed && SAFE_METHODS.includes(method) && attempt < MAX_ATTEMPTS) {
          setTimeout(() => send(attempt + 1), 250 * attempt);

          return;
        }

        console.error(`[e2e generate] ${ method } ${ target } failed: ${ e.message }`);
        if (!res.headersSent) {
          res.writeHead(502);
        }
        res.end();
      });
      upReq.end(body);
    };

    send(1);
  }

  private entry(args: {
    scope: Scope, method: string, url: URL, req: http.IncomingMessage, body: Buffer, status: number, statusText: string,
    resHeaders: http.IncomingHttpHeaders, responseBody: Buffer, started: number, mutations: number
  }): HarEntry {
    const {
      scope, method, url, req, body, status, statusText, resHeaders, responseBody, started, mutations
    } = args;
    const requestType = `${ req.headers['content-type'] || '' }`;
    const responseType = `${ resHeaders['content-type'] || '' }`;
    const time = Date.now() - started;
    const entry: HarEntry = {
      pageref:         scope.name,
      startedDateTime: new Date(started).toISOString(),
      time,
      request:         {
        method,
        url:         `${ this.origin }${ url.pathname }${ url.search }`,
        httpVersion: 'HTTP/1.1',
        headers:     requestType ? [{ name: 'content-type', value: requestType }] : [],
        queryString: Array.from(url.searchParams.entries()).map(([name, value]) => ({ name, value })),
        cookies:     [],
        headersSize: -1,
        bodySize:    body.length,
      },
      response: {
        status,
        statusText,
        httpVersion: 'HTTP/1.1',
        headers:     headerList(resHeaders, NOT_RECORDED),
        cookies:     [],
        content:     { size: responseBody.length, mimeType: responseType },
        redirectURL: `${ resHeaders.location || '' }`.replace(new URL(this.options.upstream as string).origin, this.origin),
        headersSize: -1,
        bodySize:    responseBody.length,
      },
      cache:   {},
      timings: {
        send: 0, wait: time, receive: 0
      },
      _mutations: mutations,
    };

    if (body.length && body.length <= MAX_TEXT && (!requestType || isText(requestType))) {
      entry.request.postData = { mimeType: requestType, text: body.toString('utf8') };
    }

    return entry;
  }

  private socketEntry(url: URL, scope: Scope, continuation: boolean): HarEntry {
    return {
      pageref:         scope.name,
      startedDateTime: new Date().toISOString(),
      time:            0,
      request:         {
        method:      'GET',
        url:         `${ this.origin }${ url.pathname }${ url.search }`,
        httpVersion: 'HTTP/1.1',
        headers:     [],
        queryString: Array.from(url.searchParams.entries()).map(([name, value]) => ({ name, value })),
        cookies:     [],
        headersSize: -1,
        bodySize:    0,
      },
      response: {
        status:      101,
        statusText:  'Switching Protocols',
        httpVersion: 'HTTP/1.1',
        headers:     [],
        cookies:     [],
        content:     { size: 0, mimeType: 'x-unknown' },
        redirectURL: '',
        headersSize: -1,
        bodySize:    0,
      },
      cache:   {},
      timings: {
        send: 0, wait: 0, receive: 0
      },
      _mutations:         scope.mutations,
      _resourceType:      'websocket',
      _continuation:      continuation || undefined,
      _webSocketMessages: [],
    };
  }

  private replay(req: http.IncomingMessage, res: http.ServerResponse, url: URL, body: Buffer) {
    const method = req.method || 'GET';
    const scope = this.scope;
    const pathAndQuery = `${ url.pathname }${ url.search }`;
    const key = keyFor(method, pathAndQuery);
    const entry = this.lookup(key, scope) || (method === 'GET' ? this.similar(pathAndQuery, scope) : undefined);

    scope.start(key, method);

    if (!entry) {
      const miss = `${ method } ${ pathAndQuery }`;

      scope.misses.push(miss);
      if (this.spec) {
        this.spec.missed++;
      }
      console.log(`[e2e integration] no recording: ${ miss } (${ scope.name })`);
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        type: 'error', status: 404, code: 'NotFound', message: `e2e integration mode has no recording of ${ miss }`
      }));
    } else {
      if (this.spec) {
        this.spec.replayed++;
      }
      this.learnAliases(pathAndQuery, body, entry);

      const headers: { [name: string]: string | string[] } = {};

      entry.response.headers.forEach(({ name, value }) => {
        const lower = name.toLowerCase();
        const rewritten = lower === 'location' ? this.rewrite(value, entry) : value;
        const existing = headers[lower];

        if (NOT_REPLAYED.includes(lower)) {
          return;
        }
        headers[lower] = existing === undefined ? rewritten : ([] as string[]).concat(existing, rewritten);
      });

      res.writeHead(entry.response.status, entry.response.statusText, headers);
      res.end(this.responseBody(entry));
    }

    scope.complete(method, url.pathname);
  }

  private lookup(key: string, scope: Scope): HarEntry | undefined {
    const spec = this.spec;

    if (spec) {
      const own = spec.byScope.get(scope.name)?.get(key);

      if (own?.length) {
        return this.pick(own, scope, key);
      }

      const fallback = spec.byScope.get(BEFORE_ALL_SCOPE)?.get(key) || spec.all.get(key) || spec.others.get(key);

      if (fallback?.length) {
        return fallback[fallback.length - 1];
      }
    }

    return this.global().get(key);
  }

  private similar(pathAndQuery: string, scope: Scope): HarEntry | undefined {
    const candidates = this.spec?.byPath.get(pathKey('GET', pathAndQuery));

    if (!candidates?.length) {
      return undefined;
    }

    const wanted = new Set(queryOf(pathAndQuery));
    let best: HarEntry | undefined;
    let bestScore = -1;

    candidates.forEach((entry) => {
      const score = queryOf(pathOf(entry.request.url)).filter((p) => wanted.has(p)).length + (entry.pageref === scope.name ? 0.5 : 0);

      if (score >= bestScore) {
        best = entry;
        bestScore = score;
      }
    });

    console.log(`[e2e integration] no exact recording, replaying a similar one: GET ${ pathAndQuery } (${ scope.name })`);

    return best;
  }

  private pick(entries: HarEntry[], scope: Scope, key: string): HarEntry {
    let target = -1;

    entries.forEach((e) => {
      if (e._mutations <= scope.mutations && e._mutations > target) {
        target = e._mutations;
      }
    });

    if (target === -1) {
      target = entries[0]._mutations;
    }

    const group = entries.filter((e) => e._mutations === target);
    const counter = `${ key }#${ target }`;
    const served = scope.served.get(counter) || 0;

    scope.served.set(counter, served + 1);

    return group[Math.min(served, group.length - 1)];
  }

  private global(): Map<string, HarEntry> {
    if (!this.globalIndex) {
      const index = new Map<string, HarEntry>();
      const { store, set } = this.options;
      const sets = store.sets().filter((s) => s !== set).concat(store.sets().includes(set) ? [set] : []);

      sets.forEach((s) => store.files(s).forEach((file) => {
        const har = store.readFile(file);

        har?.log.entries.forEach((entry) => {
          if (!entry._continuation) {
            this.origins.set(entry, har.log._origin);
            index.set(this.entryKey(entry), entry);
          }
        });
      }));

      console.log(`[e2e integration] indexed ${ index.size } distinct requests across ${ sets.length } recording sets`);
      this.globalIndex = index;
    }

    return this.globalIndex;
  }

  private learnAliases(pathAndQuery: string, body: Buffer, entry: HarEntry) {
    const aliases = this.spec?.aliases;

    if (!aliases) {
      return;
    }

    const live = timestamps(`${ decode(pathAndQuery) }\n${ body.length <= MAX_TEXT ? body.toString('utf8') : '' }`);

    if (!live.length) {
      return;
    }

    const recorded = timestamps(`${ decode(pathOf(entry.request.url)) }\n${ entry.request.postData?.text || '' }`);

    if (recorded.length !== live.length) {
      return;
    }

    recorded.forEach((r, i) => {
      if (r !== live[i] && !aliases.has(r)) {
        aliases.set(r, live[i]);
      }
    });
  }

  private rewrite(text: string, entry?: HarEntry): string {
    let out = text;
    const recordedOrigin = entry ? this.origins.get(entry) : undefined;

    if (recordedOrigin && recordedOrigin !== this.origin) {
      out = out.split(recordedOrigin).join(this.origin).split(`//${ new URL(recordedOrigin).host }`).join(`//${ this.host }`);
    }

    const aliases = this.spec?.aliases;

    if (aliases?.size) {
      out = out.replace(EPOCH_MS, (m) => aliases.get(m) || m);
    }

    return out;
  }

  private responseBody(entry: HarEntry): Buffer {
    const file = entry.response.content._file;
    const body = (file && this.options.store.readBody(file)) || Buffer.alloc(0);

    if (!body.length || !isText(entry.response.content.mimeType)) {
      return body;
    }

    const revision = entry.response.content._revision;
    const text = body.toString('utf8');
    const rewritten = this.rewrite(revision ? text.replace(`"revision":"${ REVISION }"`, `"revision":"${ revision }"`) : text, entry);

    return rewritten === text ? body : Buffer.from(rewritten);
  }

  private onUpgrade(req: http.IncomingMessage, socket: Duplex, head: Buffer) {
    const url = new URL(req.url || '/', this.origin);

    socket.on('error', () => socket.destroy());

    if (this.options.mode === 'generate') {
      this.recordSocket(req, socket, head, url);
    } else {
      this.replaySocket(req, socket, head, url);
    }
  }

  private recordSocket(req: http.IncomingMessage, socket: Duplex, head: Buffer, url: URL) {
    const upstreamOrigin = new URL(this.options.upstream as string);
    const target = new URL(`${ url.pathname }${ url.search }`, upstreamOrigin);

    target.protocol = upstreamOrigin.protocol === 'http:' ? 'ws:' : 'wss:';

    const protocols = `${ req.headers['sec-websocket-protocol'] || '' }`.split(',').map((p) => p.trim()).filter((p) => !!p);
    const headers: { [name: string]: string } = {
      origin:              upstreamOrigin.origin,
      'x-api-host':        this.host,
      'x-forwarded-host':  this.host,
      'x-forwarded-proto': 'https',
    };

    ['cookie', 'authorization', 'user-agent'].forEach((name) => {
      if (req.headers[name]) {
        headers[name] = `${ req.headers[name] }`;
      }
    });

    const upstream = new WebSocket(target.toString(), protocols, { headers, rejectUnauthorized: false });

    upstream.on('unexpected-response', (_, res) => {
      socket.end(`HTTP/1.1 ${ res.statusCode } ${ res.statusMessage }\r\n\r\n`);
    });
    upstream.on('error', () => socket.destroy());
    upstream.on('open', () => {
      this.wss.handleUpgrade(req, socket, head, (client) => {
        const recorded: RecordedSocket = {
          url, scope: this.scope, entry: this.socketEntry(url, this.scope, false), openedAt: Date.now()
        };
        const frame = (type: 'send' | 'receive', data: RawData, isBinary: boolean) => {
          const { scope, openedAt } = recorded;

          if (scope.closed) {
            return;
          }

          const buffer = toBuffer(data);
          const last = scope.lastWrite;
          const now = Date.now();

          recorded.entry._webSocketMessages?.push({
            type,
            time:   now / 1000,
            opcode: isBinary ? 2 : 1,
            data:   buffer.toString(isBinary ? 'base64' : 'utf8'),
            _after: last?.anchor,
            _since: now - Math.max(last?.at || 0, openedAt),
          });
        };
        const closed = () => this.recordedSockets.delete(recorded);

        recorded.scope.recorded.push({ entry: recorded.entry });
        this.recordedSockets.add(recorded);

        upstream.on('message', (data, isBinary) => {
          frame('receive', data, isBinary);
          if (client.readyState === WebSocket.OPEN) {
            client.send(toBuffer(data), { binary: isBinary });
          }
        });
        client.on('message', (data, isBinary) => {
          frame('send', data, isBinary);
          if (upstream.readyState === WebSocket.OPEN) {
            upstream.send(toBuffer(data), { binary: isBinary });
          }
        });
        upstream.on('close', (code, reason) => {
          closed();
          client.close(closeCode(code), reason);
        });
        client.on('close', (code, reason) => {
          closed();
          upstream.close(closeCode(code), reason);
        });
        upstream.on('error', () => client.terminate());
        client.on('error', () => upstream.terminate());
      });
    });
  }

  private replaySocket(req: http.IncomingMessage, socket: Duplex, head: Buffer, url: URL) {
    const scope = this.scope;
    const entry = this.lookup(keyFor(SOCKET, `${ url.pathname }${ url.search }`), scope);
    const subscribe = url.pathname.endsWith('/subscribe');
    const steve = subscribe && /\/v1\/subscribe$/.test(url.pathname);

    if (!entry) {
      scope.misses.push(`${ SOCKET } ${ url.pathname }${ url.search }`);
    }

    this.wss.handleUpgrade(req, socket, head, (client) => {
      const replay: SocketReplay = new SocketReplay(client, url, scope, entry, subscribe, steve, (text, from) => this.rewrite(text, from), () => {
        this.replayedSockets.delete(replay);
      });

      this.replayedSockets.add(replay);
    });
  }
}
