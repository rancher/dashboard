// Similar to poller, however new polling will only take place the allotted time _after_ the previous poll completes
export default class PollerSequential {
  fn;
  pollRateMs;
  maxRetries;
  timeoutId;
  tryCount = 0;

  constructor(fn, pollRateMs, maxRetries = Number.POSITIVE_INFINITY) {
    this.fn = fn || (() => {});
    this.pollRateMs = pollRateMs;
    this.maxRetries = maxRetries;
  }

  start() {
    // Ensure only one is running
    this.stop();
    // Set initial timeout to ensure timeoutId is populated
    this.timeoutId = setTimeout(() => this._poll(), this.pollRateMs);
  }

  stop() {
    if (this.timeoutId) {
      clearInterval(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  _poll() {
    // Don't continue if poller has been stopped
    if (!this.timeoutId) {
      return;
    }

    this.stop();

    this.timeoutId = setTimeout(() => {
      this._intervalMethod().then(() => this._poll());
    }, this.pollRateMs);
  }

  async _intervalMethod() {
    try {
      await this.fn();
      this.tryCount = 0;
    } catch (ex) {
      console.error('Error encountered while polling', ex); // eslint-disable-line no-console
      if (++this.tryCount >= this.maxRetries) {
        this.stop();
      }
    }
  }
}
