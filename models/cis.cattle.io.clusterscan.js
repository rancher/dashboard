import { CIS } from '@/config/types';
import { downloadFile, generateZip } from '@/utils/download';
import { isEmpty, set } from '@/utils/object';
import { sortBy } from '@/utils/sort';

export default {
  _availableActions() {
    this.getReports();
    let out = this._standardActions;

    const toFilter = ['cloneYaml', 'goToEditYaml', 'download'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const t = this.$rootGetters['i18n/t'];

    const downloadReport = {
      action:     'downloadLatestReport',
      enabled:    this.hasReport,
      icon:       'icon icon-fw icon-download',
      label:      t('cis.downloadLatestReport'),
      total:      1,
    };

    const downloadAllReports = {
      action:     'downloadAllReports',
      enabled:    this.hasReport,
      icon:       'icon icon-fw icon-download',
      label:      t('cis.downloadAllReports'),
      total:      1,
    };

    out.unshift({ divider: true });
    out.unshift(downloadAllReports);
    out.unshift(downloadReport);

    return out;
  },

  applyDefaults() {
    return () => {
      const spec = this.spec || {};

      spec.scanProfileName = null;
      spec.scanAlertRule = {};
      spec.scoreWarning = 'pass';
      set(this, 'spec', spec);
    };
  },

  hasReport: false,

  getReports() {
    return async() => {
      const owned = await this.getOwned();
      const reportCRDs = owned.filter(each => each.type === CIS.REPORT);

      this.hasReport = !!reportCRDs.length;

      return reportCRDs;
    };
  },

  downloadLatestReport() {
    return async() => {
      const reports = await this.getReports() || [];
      const report = sortBy(reports, 'metadata.creationTimestamp', true)[0];
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

  downloadAllReports() {
    return async() => {
      const toZip = {};
      const reports = await this.getReports() || [];
      const Papa = await import(/* webpackChunkName: "cis" */'papaparse');

      reports.forEach((report) => {
        try {
          const testResults = report.aggregatedTests;
          const csv = Papa.unparse(testResults);

          toZip[`${ report.id }.csv`] = csv;
        } catch (err) {
          this.$dispatch('growl/fromError', { title: 'Error downloading file', err }, { root: true });
        }
      });
      if (!isEmpty(toZip)) {
        generateZip(toZip).then((zip) => {
          downloadFile(`${ this.id }-reports`, zip, 'application/zip');
        });
      }
    };
  }

};
