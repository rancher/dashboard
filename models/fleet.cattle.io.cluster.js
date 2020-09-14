export default {
  nodeInfo() {
    const ready = this.status?.agent?.readyNodes || 0;
    const unready = this.status?.agent?.nonReadyNodes || 0;

    return {
      ready,
      unready,
      total: ready + unready,
    };
  },

  bundleInfo() {
    const ready = this.status?.summary?.ready || 0;
    const total = this.status?.summary?.desiredReady || 0;

    return {
      ready,
      unready: total - ready,
      total,
    };
  },
};
