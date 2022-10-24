import gc from './gc';

/**
 * Kick of regular GC
 */
class GarbageCollectInterval {
  private gcInterval?: NodeJS.Timer;

  /**
  * Request we start garbage collection at regular intervals
  *
  * If GC is disabled or running return early
  */
  gcStartIntervals(ctx: any) {
    const { enabled, interval } = gc.gcEnabledInterval(ctx);

    if (!gc.gcEnabledSetting(ctx) || !enabled) {
      return;
    }

    if (this.gcInterval) {
      return;
    }

    this.gcInterval = setInterval(() => {
      ctx.dispatch('garbageCollect'); // gc.garbageCollect is per store, so dispatch via central point
    }, interval * 1000);
  }

  gcStopIntervals() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      delete this.gcInterval;
    }
  }
}

const gci = new GarbageCollectInterval();

export default gci;
