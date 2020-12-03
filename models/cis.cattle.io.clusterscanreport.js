import { compare } from '@/utils/sort';

export default {
  aggregatedTests() {
    const json = this.parsedReport;
    const results = json?.results;

    const flattened = results ? results.reduce((all, each) => {
      if (each.checks) {
        all.push(...each.checks);
      }

      return all;
    }, []) : null;

    const withPadding = str => (str || '').split('.').map(n => +n + 1000).join('.');

    const sorted = flattened.slice().sort((a, b) => {
      return compare(withPadding(a.id), withPadding(b.id));
    });

    return sorted;
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
    }
  }
};
