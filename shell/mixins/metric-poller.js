import Poller from '@shell/utils/poller';

const METRICS_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  data() {
    return { metricPoller: null };
  },

  mounted() {
    this.metricPoller = new Poller(this.loadMetrics, METRICS_POLL_RATE_MS, MAX_FAILURES);
    this.metricPoller.start();
  },

  beforeDestroy() {
    this.metricPoller.stop();
  },
};
