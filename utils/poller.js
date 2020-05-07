export default class Poller {
    fn;
    pollRateMs;
    maxRetries;
    intervalId;
    tryCount = 0;

    constructor(fn, pollRateMs, maxRetries = Number.POSITIVE_INFINITY) {
      this.fn = fn || (() => {});
      this.pollRateMs = pollRateMs;
      this.maxRetries = maxRetries;
    }

    start() {
      // Ensure only one is running
      this.stop();
      this._intervalMethod();
      this.intervalId = setInterval(() => this._intervalMethod(), this.pollRateMs);
    }

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = undefined;
      }
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
