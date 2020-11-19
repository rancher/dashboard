import { CIS } from '@/config/types';
import { downloadFile } from '@/utils/download';
import { set } from '@/utils/object';

export default {
  _availableActions() {
    this.getReport();
    let out = this._standardActions;

    const toFilter = ['cloneYaml', 'goToEditYaml', 'download'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const downloadReport = {
      action:     'downloadReport',
      enabled:    this.hasReport,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'Download Report',
      total:      1,
    };

    out.unshift({ divider: true });
    out.unshift(downloadReport);

    return out;
  },

  applyDefaults() {
    return () => {
      const spec = this.spec || {};

      spec.scanProfileName = null;
      spec.scanAlertRule = {};
      set(this, 'spec', spec);
    };
  },

  hasReport: false,

  getReport() {
    return async() => {
      const owned = await this.getOwned();
      const reportCRD = owned.filter(each => each.type === CIS.REPORT)[0];

      this.hasReport = !!reportCRD;

      return reportCRD;
    };
  },

  downloadReport() {
    return async() => {
      const report = await this.getReport();
      const Papa = await import(/* webpackChunkName: "cis" */'papaparse');

      try {
        const testResults = report.aggregatedTests;
        const csv = Papa.unparse(testResults);

        downloadFile(`${ report.id }.csv`, csv, 'application/csv');
      } catch (err) {
        this.$dispatch('growl/fromError', { title: 'Error downloading file', err }, { root: true });
      }
    };
  },

};
