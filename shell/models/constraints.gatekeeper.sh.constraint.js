import jsyaml from 'js-yaml';
import SteveModel from '@shell/plugins/steve/steve-class';

export const ENFORCEMENT_ACTION_VALUES = {
  DENY:   'deny',
  DRYRUN: 'dryrun'
};

export default class GateKeeperConstraint extends SteveModel {
  async save() {
    let constraint;

    if (this.constraint) {
      constraint = await this.findLatestConstraint();
    } else {
      constraint = await this.$dispatch('cluster/create', { type: `constraints.gatekeeper.sh.${ this.kind.toLowerCase() }` }, { root: true });
    }

    constraint.spec = this.spec;
    constraint.metadata = this.metadata;

    await constraint.save();
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

  get violations() {
    const violations = this.status?.violations || [];

    return violations.map((violation) => {
      return {
        ...violation,
        resourceLink:     {
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
