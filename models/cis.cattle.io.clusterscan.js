import { CIS } from '@/config/types';
import { downloadFile } from '@/utils/download';
import { colorForState } from '@/plugins/steve/resource-instance';
import Papa from 'papaparse';

export default {
  availableActions() {
    this.getReport();
    let out = this._standardActions;

    const toFilter = ['cloneYaml', 'goToEditYaml', 'download'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });
    const downloadLogs = {
      action:     'downloadReport',
      enabled:    this.hasReport,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'Download Report',
      total:      1,
    };

    out.unshift(downloadLogs);

    return out;
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

      try {
        const testResults = report.aggregatedTests;
        const csv = Papa.unparse(testResults);

        downloadFile(`${ report.id }.csv`, csv, 'application/csv');
      } catch (err) {
        this.$dispatch('growl/fromError', { title: 'Error downloading file', err }, { root: true });
      }
    };
  },

  testState() {
    return (state) => {
      const color = colorForState.call(this, this.state);

      const bgColor = this.color.replace('text-', 'bg-');

      return { color, bgColor };
    };
  },
};
