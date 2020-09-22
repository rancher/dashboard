export default {
  aggregatedTests() {
    const json = this.parsedReport;
    const results = json?.results;

    return results ? results.reduce((all, each) => {
      if (each.checks) {
        all.push(...each.checks);
      }

      return all;
    }, []) : null;
  },

  nodes() {
    return this.parsedReport ? this.parsedReport.nodes : {};
  },

  parsedReport() {
    try {
      const json = this.spec?.reportJSON;

      const parsed = JSON.parse(json);

      return parsed;
    } catch (e) {
      console.error(e);
    }
  }
};
