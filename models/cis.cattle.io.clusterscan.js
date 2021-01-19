import { _CREATE, _EDIT } from '@/config/query-params';
import { CIS } from '@/config/types';
import { findBy } from '@/utils/array';
import { downloadFile, generateZip } from '@/utils/download';
import { get, isEmpty, set } from '@/utils/object';
import { sortBy } from '@/utils/sort';
import day from 'dayjs';

export default {
  _availableActions() {
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
      label:      t('cis.downloadReport'),
      total:      1,
    };

    const downloadAllReports = {
      action:     'downloadAllReports',
      enabled:    this.hasReport,
      icon:       'icon icon-fw icon-download',
      label:      t('cis.downloadAllReports'),
      total:      1,
    };

    if (this.hasReports) {
      out.unshift({ divider: true });
      if (this.spec?.scheduledScanConfig?.cronSchedule) {
        out.unshift(downloadAllReports);
        downloadReport.label = t('cis.downloadLatestReport');
      }
      out.unshift(downloadReport);
    }

    return out;
  },

  applyDefaults() {
    return (vm, mode) => {
      if (mode === _CREATE || mode === _EDIT) {
        const includeScheduling = this.canBeScheduled();
        const spec = this.spec || {};

        spec.scanProfileName = null;
        if (includeScheduling) {
          spec.scoreWarning = 'pass';
          spec.scheduledScanConfig = { scanAlertRule: {}, retentionCount: 3 };
        }
        set(this, 'spec', spec);
      }
    };
  },

  canBeScheduled() {
    return () => {
      const schema = this.$getters['schemaFor'](this.type);
      const specSchema = this.$getters['schemaFor'](get(schema, 'resourceFields.spec.type') || '');

      if (!specSchema) {
        return false;
      }

      return !!get(specSchema, 'resourceFields.scheduledScanConfig');
    };
  },

  isScheduled() {
    return !!get(this, 'spec.scheduledScanConfig.cronSchedule');
  },

  canUpdate() {
    return this.hasLink('update') && this.isScheduled;
  },

  hasReports() {
    const { relationships = [] } = this.metadata;

    const reportRel = findBy(relationships, 'toType', CIS.REPORT);

    return !!reportRel;
  },

  getReports() {
    return async() => {
      const owned = await this.findOwned();

      const reports = owned.filter(obj => obj.type === CIS.REPORT) || [];

      return sortBy(reports, 'metadata.creationTimestamp', true);
    };
  },

  downloadLatestReport() {
    return async() => {
      const reports = await this.getReports() || [];
      const report = sortBy(reports, 'metadata.creationTimestamp', true)[0];
      const Papa = await import(/* webpackChunkName: "csv" */'papaparse');

      try {
        const testResults = (report.aggregatedTests || []).map((result) => {
          delete result.actual_value_per_node;

          return result;
        });

        const csv = Papa.unparse(testResults);

        downloadFile(`${ labelFor(report) }.csv`, csv, 'application/csv');
      } catch (err) {
        this.$dispatch('growl/fromError', { title: 'Error downloading file', err }, { root: true });
      }
    };
  },

  downloadAllReports() {
    return async() => {
      const toZip = {};
      const reports = await this.getReports() || [];

      const Papa = await import(/* webpackChunkName: "csv" */'papaparse');

      reports.forEach((report) => {
        try {
          const testResults = (report.aggregatedTests || []).map((result) => {
            delete result.actual_value_per_node;

            return result;
          });

          const csv = Papa.unparse(testResults);

          toZip[`${ labelFor(report) }.csv`] = csv;
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
  },

};

const labelFor = (report) => {
  const { creationTimestamp } = report.metadata;

  const date = day(creationTimestamp).format('YYYY-MM-DD-HHmmss');
  const name = report.id.replace(/^scan-report-/, '');

  return `${ name }--${ date }`;
};
