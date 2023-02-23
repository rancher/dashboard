import { EventTarget } from 'event-target-shim';
import { isSafari } from '@shell/utils/platform';
import { addParam } from '@shell/utils/url';

let sockId = 1;
let warningShown = false;
let wasConnected = false;

const INSECURE = 'ws://';
const SECURE = 'wss://';

const STATE_DISCONNECTED = 'disconnected';

export const STATE_CONNECTING = 'connecting';
export const STATE_CONNECTED = 'connected';
const STATE_CLOSING = 'closing';
const STATE_RECONNECTING = 'reconnecting';

export const EVENT_CONNECTING = STATE_CONNECTING;
export const EVENT_CONNECTED = STATE_CONNECTED;
export const EVENT_DISCONNECTED = STATE_DISCONNECTED;
export const EVENT_MESSAGE = 'message';
export const EVENT_FRAME_TIMEOUT = 'frame_timeout';
export const EVENT_CONNECT_ERROR = 'connect_error';
export const EVENT_DISCONNECT_ERROR = 'disconnect_error';

export const NO_WATCH = 'NO_WATCH';
export const NO_SCHEMA = 'NO_SCHEMA';
export const REVISION_TOO_OLD = 'TOO_OLD';

export default class Socket extends EventTarget {
  url;
  autoReconnect = true;
  frameTimeout = 35000;
  metadata = {};
  hasBeenOpen = false;
  hasReconnected = false;
  protocol = null;
  maxTries = null;
  tries = 0;
  idAsTimestamp = false;

  // "Private"
  socket = null;
  state = STATE_DISCONNECTED;
  framesReceived = 0;
  frameTimer;
  reconnectTimer;
  disconnectCallBacks = [];
  disconnectedAt = 0;
  closingId = 0;

  constructor(url, autoReconnect = true, frameTimeout = null, protocol = null, maxTries = null, idAsTimestamp = false) {
    super();

    this.setUrl(url);
    this.autoReconnect = autoReconnect;
    this.protocol = protocol;
    // maxTries = null === never stop trying to reconnect
    // allow maxTries to be defined on individual sockets bc not all will clearly warn the user that we've stopped trying
    this.maxTries = maxTries;
    this.idAsTimestamp = idAsTimestamp;

    if ( frameTimeout !== null ) {
      this.frameTimeout = frameTimeout;
    }
  }

  setUrl(url) {
    if ( !url.match(/wss?:\/\//) ) {
      url = self.location.origin.replace(/^http/, 'ws') + url;
    }

    if ( self.location.protocol === 'https:' && url.startsWith(INSECURE) ) {
      url = SECURE + url.substr(INSECURE.length);
    }

    this.url = url;
  }

  connect(metadata = {}) {
    if ( this.socket ) {
      console.error('Socket refusing to connect while another socket exists'); // eslint-disable-line no-console

      return;
    }

    if (this.state !== STATE_RECONNECTING) {
      this.state = STATE_CONNECTING;
    }

    Object.assign(this.metadata, metadata);

    const id = this.idAsTimestamp ? new Date().getTime() : sockId++;
    const url = addParam(this.url, 'sockId', id);

    this._baseLog('connecting', { id, url: url.replace(/\?.*/, '') });

    let socket;

    this.tries++;

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

  disconnect(callBack) {
    if ( callBack ) {
      this.disconnectCallBacks.push(callBack);
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

      this.disconnectCallBacks.push(() => {
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

  isConnected() {
    return this.state === STATE_CONNECTED;
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
      this._log('exception', { e: e.toString() });
      // Continue anyway...
    }

    this.state = STATE_CLOSING;
  }

  _opened() {
    this._log('opened');
    const now = (new Date()).getTime();

    const atTime = this.disconnectedAt;
    let afterMilliseconds = 0;

    if ( atTime ) {
      afterMilliseconds = now - atTime;
    }

    if ( this.hasBeenOpen ) {
      this.hasReconnected = true;
    }

    this.hasBeenOpen = true;
    this.state = STATE_CONNECTED;
    this.framesReceived = 0;
    this.disconnectedAt = 0;

    this.dispatchEvent(new CustomEvent(EVENT_CONNECTED, { detail: { tries: this.tries, afterMilliseconds } }));
    this.tries = 0;
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
        this._log(`watchdog expired after${ timeout }. Closing`);
        this._close();
        this.dispatchEvent(new CustomEvent(EVENT_FRAME_TIMEOUT));
      }, timeout);
    }
  }

  _error() {
    this.closingId = (this.socket ? this.socket.sockId : 0);
    this._log('error');
  }

  _closed(event) {
    const { code, reason, wasClean } = event;

    this._baseLog('closed', {
      id: this.closingId || this.socket?.sockId || 'unknown', code, reason, clean: wasClean
    });

    this.closingId = 0;
    this.socket = null;
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.frameTimer);

    const callBacks = this.disconnectCallBacks;

    while ( callBacks.length ) {
      const fn = callBacks.pop();

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

      if (this.maxTries && this.tries > 1 && this.tries <= this.maxTries) {
        // dispatch an event which will trigger a growl from steve-plugin sockets warning users that we've lost connection and are attempting to reconnect
        const e = new CustomEvent(EVENT_CONNECT_ERROR);

        this.dispatchEvent(e);
      }

      if (this.maxTries && this.tries > this.maxTries) {
        this._log('closed. Will not reconnect (hit max attempts)');
        this.state = STATE_DISCONNECTED;
        // dispatch an event which will trigger a growl from steve-plugin sockets warning users that we've given up trying to reconnect
        this.dispatchEvent(new CustomEvent(EVENT_DISCONNECT_ERROR));
      } else {
        this._log('closed. Attempting to reconnect');
        const delay = Math.max(1000, Math.min(1000 * this.tries, 30000));

        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, delay);
      }
    } else {
      this.state = STATE_DISCONNECTED;
    }

    if ( this.state === STATE_DISCONNECTED ) {
      this.dispatchEvent(new CustomEvent(EVENT_DISCONNECTED));
    } else if ( this.state === STATE_RECONNECTING ) {
      this.dispatchEvent(new CustomEvent(EVENT_CONNECTING));
    }
  }

  /**
   * `console.log` the provided summary statement, with default information to identify the socket and the provided props
   */
  _log(summary, props) {
    this._baseLog(summary, {
      state: this.state, id: this.socket?.sockId || 0, ...props
    });
  }

  /**
   * `console.log` the provided summary statement and props
   *
   * This does not contain information to identify the socket and can be used in scenarios where it's not known or default
   */
  _baseLog(summary, props) {
    const message = [summary];
    const values = Object.entries(props || {});

    message.unshift('Socket ');

    if (values.length) {
      message.push(' (');
      values.forEach(([key, value], index) => {
        if (index !== 0) {
          message.push(`, `);
        }
        message.push(`${ key }=${ value }`);
      });
      message.push(')');
    }

    console.log(message.join('')); // eslint-disable-line no-console
  }
}
