import { NAME as PRODUCT_NAME } from '@shell/config/product/compliance';
import { COMPLIANCE } from '@shell/config/types';
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
      icon:    'icon icon-download',
      label:   t('compliance.downloadReport'),
      total:   1,
    };

    const downloadAllReports = {
      action:  'downloadAllReports',
      enabled: this.hasReport,
      icon:    'icon icon-download',
      label:   t('compliance.downloadAllReports'),
      total:   1,
    };

    const downloadReportXCCDF = {
      action:  'downloadLatestReportXCCDF',
      enabled: this.hasReport,
      icon:    'icon icon-download',
      label:   t('compliance.downloadReportXCCDF'),
      total:   1,
    };

    const downloadAllReportsXCCDF = {
      action:  'downloadAllReportsXCCDF',
      enabled: this.hasReport,
      icon:    'icon icon-download',
      label:   t('compliance.downloadAllReportsXCCDF'),
      total:   1,
    };

    if (this.hasReports) {
      out.unshift({ divider: true });
      if (this.spec?.scheduledScanConfig?.cronSchedule) {
        out.unshift(downloadAllReportsXCCDF);
        downloadReportXCCDF.label = t('compliance.downloadLatestReportXCCDF');
      }
      out.unshift(downloadReportXCCDF);
      if (this.spec?.scheduledScanConfig?.cronSchedule) {
        out.unshift(downloadAllReports);
        downloadReport.label = t('compliance.downloadLatestReport');
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

    const reportRel = findBy(relationships, 'toType', COMPLIANCE.REPORT);

    return !!reportRel;
  }

  async getReports() {
    const owned = await this.findOwned();

    const reports = owned.filter((obj) => obj.type === COMPLIANCE.REPORT) || [];

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
      this.$dispatch('growl/fromError', { title: this.t('compliance.scan.errorDownload'), err }, { root: true });
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
        this.$dispatch('growl/fromError', { title: this.t('compliance.scan.errorDownload'), err }, { root: true });
      }
    });
    if (!isEmpty(toZip)) {
      generateZip(toZip).then((zip) => {
        downloadFile(`${ this.id }-reports`, zip, 'application/zip');
      });
    }
  }

  async _resolveBenchmark() {
    const profileName = this.status?.lastRunScanProfileName;

    if (!profileName) {
      return null;
    }
    const profile = await this.$dispatch('find', { type: COMPLIANCE.CLUSTER_SCAN_PROFILE, id: profileName });
    const benchmarkId = profile?.spec?.benchmarkVersion;

    if (!benchmarkId) {
      return null;
    }

    return this.$dispatch('find', { type: COMPLIANCE.BENCHMARK, id: benchmarkId });
  }

  // Fetches the kube-bench profile ConfigMap referenced by the benchmark and
  // parses its metadata.yaml data key. Top-level fields become the XCCDF
  // benchmark metadata; the checks: map becomes per-check decorations
  // (framework-agnostic; STIG, CIS, BSI, etc. all populate the same shape).
  async _resolveExportMetadata(benchmark) {
    const name = benchmark?.spec?.customBenchmarkConfigMapName;
    const namespace = benchmark?.spec?.customBenchmarkConfigMapNamespace;
    const empty = { metadata: {}, decorations: {} };

    if (!name || !namespace) {
      return empty;
    }

    try {
      const cm = await this.$dispatch('find', { type: 'configmap', id: `${ namespace }/${ name }` });
      const raw = cm?.data?.['metadata.yaml'];

      if (!raw) {
        return empty;
      }

      const jsyaml = await import(/* webpackChunkName: "js-yaml" */'js-yaml');
      const parsed = jsyaml.load(raw) || {};
      const { checks = {}, ...rest } = parsed;

      return { metadata: rest, decorations: checks };
    } catch (e) {
      return empty;
    }
  }

  async downloadLatestReportXCCDF() {
    const reports = await this.getReports() || [];
    const report = sortBy(reports, 'metadata.creationTimestamp', true)[0];

    try {
      const benchmark = await this._resolveBenchmark();
      const { metadata, decorations } = await this._resolveExportMetadata(benchmark);
      const { generateXCCDFPerNode } = await import(/* webpackChunkName: "xccdf" */'@shell/utils/xccdf');

      const parsed = report.parsedReport || {};
      const common = {
        report:           parsed,
        benchmarkVersion: parsed.version || benchmark?.spec?.benchmarkVersion || '',
        metadata,
        decorations,
      };

      const toZip = {};

      if (!Object.entries(parsed.nodes || {}).length) {
        this.$dispatch('growl/fromError', { title: this.t('compliance.scan.errorNoParsedNodes') }, { root: true });
      } else {
        Object.entries(parsed.nodes || {}).forEach(([role, hosts]) => {
          (hosts || []).forEach((hostname) => {
            const xml = generateXCCDFPerNode({
              ...common, hostname, role,
            });

            toZip[`${ labelFor(report) }--${ hostname }.xml`] = xml;
          });
        });

        if (!isEmpty(toZip)) {
          const zip = await generateZip(toZip);

          downloadFile(`${ labelFor(report) }-per-node.zip`, zip, 'application/zip');
        }
      }
    } catch (err) {
      this.$dispatch('growl/fromError', { title: this.t('compliance.scan.errorDownload'), err }, { root: true });
    }
  }

  async downloadAllReportsXCCDF() {
    const toZip = {};
    const reports = await this.getReports() || [];

    try {
      const benchmark = await this._resolveBenchmark();
      const { metadata, decorations } = await this._resolveExportMetadata(benchmark);
      const { generateXCCDFPerNode } = await import(/* webpackChunkName: "xccdf" */'@shell/utils/xccdf');

      const hasParsedNodes = reports.some((report) => Object.entries(report.parsedReport?.nodes || {}).length);

      if (!hasParsedNodes) {
        this.$dispatch('growl/fromError', { title: this.t('compliance.scan.errorNoParsedNodes') }, { root: true });
      } else {
        reports.forEach((report) => {
          try {
            const parsed = report.parsedReport || {};
            const common = {
              report:           parsed,
              benchmarkVersion: parsed.version || benchmark?.spec?.benchmarkVersion || '',
              metadata,
              decorations,
            };
            const folder = labelFor(report);

            Object.entries(parsed.nodes || {}).forEach(([role, hosts]) => {
              (hosts || []).forEach((hostname) => {
                const xml = generateXCCDFPerNode({
                  ...common, hostname, role,
                });

                toZip[`${ folder }/${ hostname }.xml`] = xml;
              });
            });
          } catch (err) {
            this.$dispatch('growl/fromError', { title: this.t('compliance.scan.errorDownload'), err }, { root: true });
          }
        });

        if (!isEmpty(toZip)) {
          generateZip(toZip).then((zip) => {
            downloadFile(`${ this.id }-reports-xccdf-per-node.zip`, zip, 'application/zip');
          });
        }
      }
    } catch (err) {
      this.$dispatch('growl/fromError', { title: this.t('compliance.scan.errorDownload'), err }, { root: true });
    }
  }

  get scanProfileLink() {
    if (this.status?.lastRunScanProfileName) {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          resource: COMPLIANCE.CLUSTER_SCAN_PROFILE,
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
