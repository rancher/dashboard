import { isSafari } from '@/utils/platform';
import { addParam } from '@/utils/url';

declare global {
  interface WebSocket {

    sockId: number;
    metadata: Object;
  }
}

let sockId = 1;
let warningShown = false;
let wasConnected = false;

const INSECURE = 'ws://';
const SECURE = 'wss://';

export const EVENT_CONNECTED = 'connected';
export const EVENT_DISCONNECTED = 'disconnected';
export const EVENT_MESSAGE = 'message';
export const EVENT_FRAME_TIMEOUT = 'frame_timeout';
export const EVENT_CONNECT_ERROR = 'connect_error';

const STATE_DISCONNECTED = 'disconnected';
const STATE_CONNECTING = 'connecting';
const STATE_CONNECTED = 'connected';
const STATE_CLOSING = 'closing';
const STATE_RECONNECTING = 'reconnecting';

export default class Socket extends EventTarget {
  url: string;
  autoReconnect: boolean = true;
  frameTimeout: number = 32000;
  metadata: object = {};

  private socket: WebSocket | null = null;
  private state: string = STATE_DISCONNECTED;
  private framesReceived: number = 0;
  private frameTimer: any;
  private reconnectTimer: any;
  private tries: number = 0;
  private disconnectCbs: Array<Function> = [];
  private disconnectedAt: number = 0;
  private closingId: number = 0;

  constructor(url: string, autoReconnect: boolean = true) {
    super();

    if ( !url.match(/wss?:\/\//) ) {
      url = window.location.origin.replace(/^http/, 'ws') + url;
    }

    if ( window.location.protocol === 'https:' && url.startsWith(INSECURE) ) {
      url = SECURE + url.substr(INSECURE.length);
    }

    this.url = url;
    this.autoReconnect = autoReconnect;
  }

  connect(metadata: object = {}) {
    if ( this.socket ) {
      console.error('Socket refusing to connect while another socket exists');

      return;
    }

    Object.assign(this.metadata, metadata);

    const url = this.url;
    const id = sockId++;

    console.log(`Socket connecting (id=${ id }, url=${ `${ url.replace(/\?.*/, '') }...` })`);

    const socket = new WebSocket(addParam(url, 'sockId', id));

    socket.sockId = id;
    socket.metadata = this.metadata;
    socket.onmessage = this.onmessage.bind(this);
    socket.onopen = this.opened.bind(this);
    socket.onerror = this.error.bind(this);
    socket.onclose = this.closed.bind(this);

    this.socket = socket;
    this.state = STATE_CONNECTING;
  }

  send(data: any) {
    if ( this.socket &&  this.state === STATE_CONNECTED ) {
      this.socket.send(data);
    }
  }

  disconnect(cb: Function) {
    if ( cb ) {
      this.disconnectCbs.push(cb);
    }

    this.autoReconnect = false;
    this.close();
  }

  reconnect(metadata: object) {
    Object.assign(this.metadata, metadata);

    if ( this.state === STATE_CONNECTING ) {
      this.log('Ignoring reconnect for socket in connecting');

      return;
    }

    if ( this.socket ) {
      this.close();
    } else {
      this.connect(metadata);
    }
  }

  getMetadata(): Object {
    if ( this.socket ) {
      return this.socket.metadata;
    } else {
      return {};
    }
  }

  getId(): Number {
    if ( this.socket ) {
      return this.socket.sockId;
    } else {
      return 0;
    }
  }

  protected close() {
    const socket = this.socket;

    if ( !socket ) {
      return;
    }

    try {
      this.log('closing');
      this.closingId = socket.sockId;
      socket.onopen = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
    } catch (e) {
      this.log('Socket exception', e);
      // Continue anyway...
    }

    this.state = STATE_CLOSING;
  }

  protected opened() {
    this.log('opened');
    const now = (new Date()).getTime();

    const at = this.disconnectedAt;
    let after: Number = 0;

    if ( at ) {
      after = now - at;
    }

    this.state = STATE_CONNECTED;
    this.framesReceived = 0;
    this.disconnectedAt = 0;

    const e = new CustomEvent(EVENT_CONNECTED, { detail: { tries: this.tries, after } });

    this.dispatchEvent(e);
    this.resetWatchdog();
    clearTimeout(this.reconnectTimer);
  }

  protected onmessage(event) {
    this.resetWatchdog();
    this.tries = 0;
    this.framesReceived++;

    const e = new CustomEvent(EVENT_MESSAGE, { detail: event });

    this.dispatchEvent(e);
  }

  protected resetWatchdog() {
    clearTimeout(this.frameTimer);

    const timeout = this.frameTimeout;

    if ( timeout && this.state === STATE_CONNECTED) {
      this.frameTimer = setTimeout(() => {
        this.log('Socket watchdog expired after', timeout, 'closing');
        this.close();
        this.dispatchEvent(new Event(EVENT_FRAME_TIMEOUT));
      }, timeout);
    }
  }

  protected error() {
    this.closingId = (this.socket ? this.socket.sockId : 0);
    this.log('error');
  }

  protected closed() {
    console.log(`Socket ${ this.closingId } closed`);

    this.closingId = 0;
    this.socket = null;
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.frameTimer);

    const cbs = this.disconnectCbs;

    while ( cbs.length ) {
      const fn = cbs.pop();

      if ( fn ) {
        fn.apply(this);
      }
    }

    if ( [STATE_CONNECTED, STATE_CLOSING].includes(this.state) ) {
      this.dispatchEvent(new Event(EVENT_DISCONNECTED));
      wasConnected = true;
    }

    if ( !this.disconnectedAt ) {
      this.disconnectedAt = (new Date()).getTime();
    }

    if ( !warningShown && !wasConnected ) {
      this.autoReconnect = false;
      this.state = STATE_DISCONNECTED;

      const e = new CustomEvent(EVENT_CONNECT_ERROR, { detail: { isSafari } });

      this.dispatchEvent(e);
      warningShown = true;
    } else if ( this.autoReconnect ) {
      this.state = STATE_RECONNECTING;
      this.tries++;
      const delay = Math.max(1000, Math.min(1000 * this.tries, 30000));

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.state = STATE_DISCONNECTED;
    }
  }

  protected log(...args: any[]) {
    args.unshift('Socket');

    args.push(`(state=${ this.state }, id=${ this.socket ? this.socket.sockId : 0 })`);

    console.log(args.join(' '));
  }
}
