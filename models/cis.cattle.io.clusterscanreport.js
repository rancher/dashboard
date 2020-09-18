export default {
  aggregatedTests() {
    const json = this.reportJSON;
    const results = json?.results;

    return results ? results.reduce((all, each) => {
      if (each.checks) {
        all.push(...each.checks);
      }

      return all;
    }, []) : null;
  },

  nodes() {
    return this.reportJSON ? this.reportJSON.nodes : {};
  },

  reportJSON() {
    try {
      const json = this.spec?.reportJSON;

      const parsed = JSON.parse(json);

      return parsed;
    } catch (e) {
    }
  }
};
