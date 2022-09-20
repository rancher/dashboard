import gc from './gc';

/**
 * Kick of regular GC
 */
class GarbageCollectInterval {
  /**
  * Execute GC at a given interval
  */
  static GC_RUN_ON_INTERVAL = true;

  /**
  * Run GC at this cadence
  */
  static GC_INTERVAL = 1000 * 10;

  private gcInterval?: NodeJS.Timer;

  /**
  * Request we start garbage collection at regular intervals
  *
  * If GC is disabled or running return early
  */
  gcStartIntervals(ctx: any) {
    if (!gc.gcEnabledSetting(ctx) || !GarbageCollectInterval.GC_RUN_ON_INTERVAL) {
      console.warn('root gcStartIntervals', 'IGNORING (disabled)');// TODO: RC LOG

      return;
    }

    if (this.gcInterval) {
      return;
    }
    console.warn('root gcStartIntervals', 'start'); // TODO: RC LOG

    this.gcInterval = setInterval(() => {
      ctx.dispatch('garbageCollect'); // gc.garbageCollect is per store, so dispatch via central point
    }, GarbageCollectInterval.GC_INTERVAL);
  }

  gcStopIntervals() {
    console.warn('root gcStartIntervals', 'stpp'); // TODO: RC LOG
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
    }
  }
}

const gci = new GarbageCollectInterval();

export default gci;
