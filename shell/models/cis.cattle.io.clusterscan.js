import { NAME as PRODUCT_NAME } from '@shell/config/product/cis';
import { CIS } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import { downloadFile, generateZip } from '@shell/utils/download';
import { get, isEmpty } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import day from 'dayjs';
import SteveModel from '@shell/plugins/steve/steve-class';

// This could be removed and just replaced with schema.fetchResourceFields()... but there's some getters that use hasSpecsScheduledScanConfig before it runs
/**
 * For the given schema, determine if the schema of it's associated scan's type has scheduledScanConfig
 *
 * This is resourceFields based, so we need to fetch schema definition
 */
export const fetchSpecsScheduledScanConfig = async(schema) => {
  await schema.fetchResourceFields();

  return hasSpecsScheduledScanConfig(schema);
};

/**
 * For the given schema, determine if the schema of it's associated scan's type has scheduledScanConfig
 *
 * Assumes schemaDefinitions have been fetched (see async fetchSpecsScheduledScanConfig above)
 */
export const hasSpecsScheduledScanConfig = (schema) => {
  const specSchemaId = get(schema, 'resourceFields.spec.type');
  const specSchema = schema.schemaDefinitions?.[specSchemaId];

  if (!specSchema) {
    return false;
  }

  return !!get(specSchema, 'resourceFields.scheduledScanConfig');
};

export default class ClusterScan extends SteveModel {
  get _availableActions() {
    let out = super._availableActions;

    const toFilter = ['cloneYaml', 'goToEditYaml', 'download'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const t = this.$rootGetters['i18n/t'];

    const downloadReport = {
      action:  'downloadLatestReport',
      enabled: this.hasReport,
      icon:    'icon icon-fw icon-download',
      label:   t('cis.downloadReport'),
      total:   1,
    };

    const downloadAllReports = {
      action:  'downloadAllReports',
      enabled: this.hasReport,
      icon:    'icon icon-fw icon-download',
      label:   t('cis.downloadAllReports'),
      total:   1,
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
  }

  canBeScheduled() {
    return hasSpecsScheduledScanConfig(this.$getters['schemaFor'](this.type));
  }

  get isScheduled() {
    return !!get(this, 'spec.scheduledScanConfig.cronSchedule');
  }

  get canUpdate() {
    return this.hasLink('update') && this.isScheduled;
  }

  get hasReports() {
    const { relationships = [] } = this.metadata;

    const reportRel = findBy(relationships, 'toType', CIS.REPORT);

    return !!reportRel;
  }

  async getReports() {
    const owned = await this.findOwned();

    const reports = owned.filter((obj) => obj.type === CIS.REPORT) || [];

    return sortBy(reports, 'metadata.creationTimestamp', true);
  }

  async downloadLatestReport() {
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
  }

  async downloadAllReports() {
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
  }

  get scanProfileLink() {
    if (this.status?.lastRunScanProfileName) {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          resource: CIS.CLUSTER_SCAN_PROFILE,
          product:  PRODUCT_NAME,
          id:       this.status?.lastRunScanProfileName
        }
      };
    }

    return {};
  }
}

const labelFor = (report) => {
  const { creationTimestamp } = report.metadata;

  const date = day(creationTimestamp).format('YYYY-MM-DD-HHmmss');
  const name = report.id.replace(/^scan-report-/, '');

  return `${ name }--${ date }`;
};
