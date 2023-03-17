export default class Trace {
  __label;
  __debugWatcher = false;

  constructor(label) {
    this.__label = label;
  }

  trace(...args) {
    this.__debugWatcher && console.info(`${ this.__label }:`, ...args); // eslint-disable-line no-console
  }

  setDebug(on) {
    this.__debugWatcher = !!on;
  }
}
