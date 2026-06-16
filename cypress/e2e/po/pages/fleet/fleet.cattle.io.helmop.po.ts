import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';

export class FleetHelmOpCreateEditPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace?: string, helmOpName?: string) {
    const root = `/c/_/fleet/application/fleet.cattle.io.helmop`;

    return fleetWorkspace ? `${ root }/${ fleetWorkspace }/${ helmOpName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace?: string, helmOpName?: string) {
    super(FleetHelmOpCreateEditPo.createPath(fleetWorkspace, helmOpName));
  }

  setChart(chart: string) {
    return LabeledInputPo.byLabel(this.self(), 'Chart').set(chart);
  }

  setRepository(repo: string) {
    return LabeledInputPo.byLabel(this.self(), 'Repository').set(repo);
  }

  setVersion(version: string) {
    return LabeledInputPo.byLabel(this.self(), 'Version').set(version);
  }

  setTargetNamespace(namespace: string) {
    return LabeledInputPo.byLabel(this.self(), 'Target Namespace').set(namespace);
  }

  targetClusterOptions(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="fleet-target-cluster-radio-button"]');
  }

  targetCluster(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="fleet-target-cluster-name-selector"]');
  }

  helmAuthSelectOrCreate() {
    return new SelectOrCreateAuthPo('[data-testid="helmop-helm-auth"]');
  }

  secretsSelector(): LabeledSelectPo {
    return LabeledSelectPo.byLabel(this.self(), 'Secrets');
  }

  configMapsSelector(): LabeledSelectPo {
    return LabeledSelectPo.byLabel(this.self(), 'Config Maps');
  }
}
