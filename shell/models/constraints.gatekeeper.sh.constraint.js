import jsyaml from 'js-yaml';
import SteveModel from '@shell/plugins/steve/steve-class';
import { downloadFile } from '@shell/utils/download';

export const ENFORCEMENT_ACTION_VALUES = {
  DENY:   'deny',
  DRYRUN: 'dryrun'
};

export default class GateKeeperConstraint extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    const t = this.$rootGetters['i18n/t'];

    const downloadViolations = {
      action: 'downloadViolations',
      icon:   'icon icon-fw icon-download',
      label:  t('gatekeeperConstraint.downloadViolations'),
      total:  1,
    };

    out.unshift(downloadViolations);

    return out;
  }

  async save() {
    let constraint;
    let resourceVersion;

    if (this.constraint) {
      constraint = await this.findLatestConstraint();
      resourceVersion = constraint?.metadata?.resourceVersion;
    } else {
      constraint = await this.$dispatch('cluster/create', { type: `constraints.gatekeeper.sh.${ this.kind.toLowerCase() }` }, { root: true });
    }

    constraint.spec = this.spec;
    constraint.metadata = this.metadata;
    if (resourceVersion) {
      constraint.metadata.resourceVersion = resourceVersion;
    }

    await constraint.save();
  }

  async downloadViolations() {
    const Papa = await import(/* webpackChunkName: "csv" */'papaparse');

    try {
      const violations = (this.violations || []).map((violation) => {
        delete violation.resourceLink;
        delete violation.constraintLink;

        return violation;
      });

      const csv = Papa.unparse(violations);

      downloadFile(`violations-${ this.name }.csv`, csv, 'application/csv');
    } catch (err) {
      this.$dispatch('growl/fromError', { title: 'Error downloading file', err }, { root: true });
    }
  }

  cleanForNew() {
    this.$dispatch(`cleanForNew`, this);

    if (this.constraint) {
      delete this.constraint;
    }
  }

  saveYaml(yaml) {
    const parsed = jsyaml.load(yaml);

    Object.assign(this, parsed);

    return this.save();
  }

  async remove() {
    const constraint = await this.findLatestConstraint();

    return constraint.remove();
  }

  findLatestConstraint() {
    return this.$dispatch('cluster/find', {
      type: this.constraint.type, id: this.constraint.id, opt: { force: true }
    }, { root: true });
  }

  get totalViolations() {
    return this.status?.totalViolations || this.violations.length;
  }

  get violations() {
    const violations = this.status?.violations || [];

    return violations.map((violation) => {
      return {
        ...violation,
        resourceLink: {
          text: violation.name,
          to:   {
            name:   'c-cluster-product-resource-id',
            params: {
              resource: violation.kind.toLowerCase(), id: violation.name, product: 'explorer'
            }
          }
        },
        constraintLink: {
          text: this.nameDisplay,
          to:   this.detailLocation
        }
      };
    });
  }
}
