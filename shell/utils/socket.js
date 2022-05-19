import { EventTarget } from 'event-target-shim';
import { isSafari } from '@shell/utils/platform';
import { addParam } from '@shell/utils/url';

let sockId = 1;
let warningShown = false;
let wasConnected = false;

const INSECURE = 'ws://';
const SECURE = 'wss://';

const STATE_DISCONNECTED = 'disconnected';
const STATE_CONNECTING = 'connecting';
const STATE_CONNECTED = 'connected';
const STATE_CLOSING = 'closing';
const STATE_RECONNECTING = 'reconnecting';

export const EVENT_CONNECTING = STATE_CONNECTING;
export const EVENT_CONNECTED = STATE_CONNECTED;
export const EVENT_DISCONNECTED = STATE_DISCONNECTED;
export const EVENT_MESSAGE = 'message';
export const EVENT_FRAME_TIMEOUT = 'frame_timeout';
export const EVENT_CONNECT_ERROR = 'connect_error';

export default class Socket extends EventTarget {
  url;
  autoReconnect = true;
  frameTimeout = 35000;
  metadata = {};
  hasBeenOpen = false;
  hasReconnected = false;
  protocol = null;

  // "Private"
  socket = null;
  state = STATE_DISCONNECTED;
  framesReceived = 0;
  frameTimer;
  reconnectTimer;
  tries = 0;
  disconnectCbs = [];
  disconnectedAt = 0;
  closingId = 0;

  constructor(url, autoReconnect = true, frameTimeout = null, protocol = null) {
    super();

    this.setUrl(url);
    this.autoReconnect = autoReconnect;
    this.protocol = protocol;

    if ( frameTimeout !== null ) {
      this.frameTimeout = frameTimeout;
    }
  }

  setUrl(url) {
    if ( !url.match(/wss?:\/\//) ) {
      url = window.location.origin.replace(/^http/, 'ws') + url;
    }

    if ( window.location.protocol === 'https:' && url.startsWith(INSECURE) ) {
      url = SECURE + url.substr(INSECURE.length);
    }

    this.url = url;
  }

  connect(metadata = {}) {
    if ( this.socket ) {
      console.error('Socket refusing to connect while another socket exists'); // eslint-disable-line no-console

      return;
    }

    Object.assign(this.metadata, metadata);

    const id = sockId++;
    const url = addParam(this.url, 'sockId', id);

    console.log(`Socket connecting (id=${ id }, url=${ `${ url.replace(/\?.*/, '') }...` })`); // eslint-disable-line no-console

    let socket;

    if ( this.protocol ) {
      socket = new WebSocket(url, this.protocol);
    } else {
      socket = new WebSocket(url);
    }

    socket.sockId = id;
    socket.metadata = this.metadata;
    socket.onmessage = this._onmessage.bind(this);
    socket.onopen = this._opened.bind(this);
    socket.onerror = this._error.bind(this);
    socket.onclose = this._closed.bind(this);

    this.socket = socket;
    this.state = STATE_CONNECTING;

    this.dispatchEvent(new CustomEvent(EVENT_CONNECTING));
  }

  send(data) {
    if ( this.socket && this.state === STATE_CONNECTED ) {
      this.socket.send(data);

      return true;
    }

    return false;
  }

  disconnect(cb) {
    if ( cb ) {
      this.disconnectCbs.push(cb);
    }

    const self = this;
    const promise = new Promise((resolve, reject) => {
      if ( this.state === STATE_DISCONNECTED ) {
        resolve();
      }

      function onError(e) {
        reject(e);
        self.removeEventListener(EVENT_CONNECT_ERROR, onError);
      }

      this.addEventListener(EVENT_CONNECT_ERROR, onError);

      this.disconnectCbs.push(() => {
        this.removeEventListener(EVENT_CONNECT_ERROR, onError);
        resolve();
      });
    });

    this.autoReconnect = false;
    this._close();

    return promise;
  }

  reconnect(metadata = {}) {
    Object.assign(this.metadata, metadata);

    if ( this.state === STATE_CONNECTING ) {
      this._log('Ignoring reconnect for socket in connecting');

      return;
    }

    if ( this.socket ) {
      this._close();
    } else {
      this.connect(metadata);
    }
  }

  getMetadata() {
    if ( this.socket ) {
      return this.socket.metadata;
    } else {
      return {};
    }
  }

  getId() {
    if ( this.socket ) {
      return this.socket.sockId;
    } else {
      return 0;
    }
  }

  setAutoReconnect(autoReconnect) {
    this.autoReconnect = autoReconnect;
  }

  // "Private"
  _close() {
    const socket = this.socket;

    if ( !socket ) {
      return;
    }

    try {
      this._log('closing');
      this.closingId = socket.sockId;
      socket.onopen = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
    } catch (e) {
      this._log('Socket exception', e);
      // Continue anyway...
    }

    this.state = STATE_CLOSING;
  }

  _opened() {
    this._log('opened');
    const now = (new Date()).getTime();

    const at = this.disconnectedAt;
    let after = 0;

    if ( at ) {
      after = now - at;
    }

    if ( this.hasBeenOpen ) {
      this.hasReconnected = true;
    }

    this.hasBeenOpen = true;
    this.state = STATE_CONNECTED;
    this.framesReceived = 0;
    this.disconnectedAt = 0;

    this.dispatchEvent(new CustomEvent(EVENT_CONNECTED, { detail: { tries: this.tries, after } }));
    this._resetWatchdog();
    clearTimeout(this.reconnectTimer);
  }

  _onmessage(event) {
    this._resetWatchdog();
    this.tries = 0;
    this.framesReceived++;

    this.dispatchEvent(new CustomEvent(EVENT_MESSAGE, { detail: event }));
  }

  _resetWatchdog() {
    clearTimeout(this.frameTimer);

    const timeout = this.frameTimeout;

    if ( timeout && this.state === STATE_CONNECTED) {
      this.frameTimer = setTimeout(() => {
        this._log('Socket watchdog expired after', timeout, 'closing');
        this._close();
        this.dispatchEvent(new CustomEvent(EVENT_FRAME_TIMEOUT));
      }, timeout);
    }
  }

  _error() {
    this.closingId = (this.socket ? this.socket.sockId : 0);
    this._log('error');
  }

  _closed() {
    console.log(`Socket ${ this.closingId } closed`); // eslint-disable-line no-console

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

    if ( this.state === STATE_DISCONNECTED ) {
      this.dispatchEvent(new CustomEvent(EVENT_DISCONNECTED));
    } else if ( this.state === STATE_RECONNECTING ) {
      this.dispatchEvent(new CustomEvent(EVENT_CONNECTING));
    }
  }

  _log(...args) {
    args.unshift('Socket');

    args.push(`(state=${ this.state }, id=${ this.socket ? this.socket.sockId : 0 })`);

    console.log(args.join(' ')); // eslint-disable-line no-console
  }
}
