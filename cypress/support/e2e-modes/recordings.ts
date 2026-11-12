import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

/**
 * Recordings are HAR 1.2 files (http://www.softwareishard.com/blog/har-12-spec/), one per spec and recording set.
 *
 * - Each test (and each group of hooks between tests) is a HAR page, and its requests are entries that point at it
 * - Response bodies are stored once, gzipped and content addressed, under `bodies/` and referenced by
 *   `response.content._file` (the convention Playwright uses for HARs recorded with `content: 'attach'`)
 * - Web socket frames are stored in `_webSocketMessages`, as Chrome's HAR export does
 *
 * Custom fields (prefixed `_`, as the HAR spec allows) record what the replay needs to keep requests and web
 * socket frames in step with the test, see `HarEntry._mutations`
 */

export interface HarNameValue {
  name: string;
  value: string;
}

export interface HarWebSocketMessage {
  type: 'send' | 'receive';
  /** Seconds since the epoch, as Chrome's HAR export */
  time: number;
  opcode: number;
  data: string;
  /**
   * The last request that changed something to start before the frame: its method, URL and which time the test made
   * it, e.g. `PUT /v1/foo#2`. The frame is replayed once that request has been made again
   */
  _after?: string;
  /** Milliseconds between that request starting (or the socket opening, if later) and the frame */
  _since: number;
}

export interface HarEntry {
  pageref: string;
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: HarNameValue[];
    queryString: HarNameValue[];
    cookies: HarNameValue[];
    headersSize: number;
    bodySize: number;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: HarNameValue[];
    cookies: HarNameValue[];
    content: {
      size: number;
      mimeType: string;
      _file?: string;
      /** The list's `revision`, which the stored body has as `{revision}` */
      _revision?: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
  /** How many requests that change state (POST, PUT, PATCH, DELETE) the test had completed before this one started */
  _mutations: number;
  _resourceType?: 'websocket';
  _webSocketMessages?: HarWebSocketMessage[];
  /** A socket opened in an earlier test of a spec that keeps the page between tests: the frames it received in this one */
  _continuation?: boolean;
}

export interface HarPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: Record<string, never>;
}

export interface Har {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    pages: HarPage[];
    entries: HarEntry[];
    /** The origin the requests were made to */
    _origin: string;
  };
}

const BODIES_DIR = 'bodies';
const SPEC_ROOT = 'cypress/e2e/tests/';

const EXTENSIONS: { [mime: string]: string } = {
  'application/json':       'json',
  'application/yaml':       'yaml',
  'application/x-yaml':     'yaml',
  'application/javascript': 'js',
  'text/javascript':        'js',
  'text/css':               'css',
  'text/html':              'html',
  'text/plain':             'txt',
  'image/svg+xml':          'svg',
  'image/png':              'png',
};

export function emptyHar(origin: string): Har {
  return {
    log: {
      version: '1.2',
      creator: { name: '@rancher/cypress e2e generate mode', version: '1.0' },
      pages:   [],
      entries: [],
      _origin: origin,
    }
  };
}

function serialize(har: Har): string {
  const { pages, entries, ...log } = har.log;
  const lines = (items: any[]) => items.map((item) => JSON.stringify(item)).join(',\n');

  return `{"log":${ JSON.stringify(log).replace(/}$/, '') },\n"pages":[\n${ lines(pages) }\n],\n"entries":[\n${ lines(entries) }\n]}}\n`;
}

/**
 * Reads and writes the HAR files and response bodies under one recordings directory
 */
export class RecordingStore {
  private bodyCache = new Map<string, Buffer>();

  constructor(public readonly dir: string) {}

  /**
   * The HAR file of a spec, e.g. `cypress/e2e/tests/pages/generic/home.spec.ts` in set `admin` is `admin/pages/generic/home.har`
   */
  specFile(set: string, spec: string): string {
    const relative = (spec.startsWith(SPEC_ROOT) ? spec.substring(SPEC_ROOT.length) : spec).replace(/\.spec\.[jt]s$/, '');

    return path.join(this.dir, set, `${ relative }.har`);
  }

  read(set: string, spec: string): Har | undefined {
    return this.readFile(this.specFile(set, spec));
  }

  readFile(file: string): Har | undefined {
    if (!fs.existsSync(file)) {
      return undefined;
    }

    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  write(set: string, spec: string, har: Har) {
    const file = this.specFile(set, spec);

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, serialize(har));
  }

  /**
   * The recording sets that exist, e.g. one per user the tests run as
   */
  sets(): string[] {
    if (!fs.existsSync(this.dir)) {
      return [];
    }

    return fs.readdirSync(this.dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== BODIES_DIR)
      .map((d) => d.name);
  }

  files(set: string): string[] {
    const root = path.join(this.dir, set);
    const found: string[] = [];
    const walk = (dir: string) => {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
        const full = path.join(dir, d.name);

        if (d.isDirectory()) {
          walk(full);
        } else if (d.name.endsWith('.har')) {
          found.push(full);
        }
      });
    };

    if (fs.existsSync(root)) {
      walk(root);
    }

    return found;
  }

  /**
   * Store a response body, returning the name to reference it by from `response.content._file`
   */
  writeBody(body: Buffer, mimeType: string): string {
    const sha = crypto.createHash('sha1').update(body).digest('hex');
    const ext = EXTENSIONS[mimeType.split(';')[0].trim()] || 'bin';
    const name = `${ sha.substring(0, 2) }/${ sha }.${ ext }.gz`;
    const file = path.join(this.dir, BODIES_DIR, name);

    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, zlib.gzipSync(body, { level: 9 }));
    }

    return name;
  }

  readBody(name: string): Buffer | undefined {
    const cached = this.bodyCache.get(name);

    if (cached) {
      return cached;
    }

    const file = path.join(this.dir, BODIES_DIR, name);

    if (!fs.existsSync(file)) {
      return undefined;
    }

    const body = name.endsWith('.gz') ? zlib.gunzipSync(fs.readFileSync(file)) : fs.readFileSync(file);

    this.bodyCache.set(name, body);

    return body;
  }
}
