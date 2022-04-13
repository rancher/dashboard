import { compare } from '@shell/utils/sort';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class CISReport extends SteveModel {
  get aggregatedTests() {
    const json = this.parsedReport;
    const results = json?.results;

    const flattened = results ? results.reduce((all, each) => {
      if (each.checks) {
        all.push(...each.checks);
      }

      return all;
    }, []) : null;

    const sortableId = id => (id || '').split('.').map(n => +n + 1000).join('.');
    const sortableState = (state) => {
      const SORT_ORDER = {
        other:         7,
        notApplicable: 6,
        skip:          5,
        pass:          4,
        warn:          3,
        mixed:         2,
        fail:          1,
      };

      return `${ SORT_ORDER[state] || SORT_ORDER['other'] } ${ state }`;
    };

    const sorted = flattened.slice().sort((a, b) => {
      const stateSort = compare(sortableState(a.state), sortableState(b.state));
      const idSort = compare(sortableId(a.id), sortableId(b.id));

      if (stateSort) {
        return stateSort;
      }

      return idSort;
    });

    return sorted;
  }

  get nodes() {
    return this.parsedReport ? this.parsedReport.nodes : {};
  }

  get parsedReport() {
    try {
      const json = this.spec?.reportJSON;

      const parsed = JSON.parse(json);

      return parsed;
    } catch (e) {
    }

    return null;
  }
}
