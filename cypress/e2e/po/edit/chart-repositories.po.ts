import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import UnitInputPo from '@/cypress/e2e/po/components/unit-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';
import KeyValuePo from '@/cypress/e2e/po/components/key-value.po';

export default class ChartRepositoriesCreateEditPo extends PagePo {
  private static createPath(clusterId: string, product: 'apps' | 'manager', repoName?: string ) {
    const root = `/c/${ clusterId }/${ product }/catalog.cattle.io.clusterrepo`;

    return repoName ? `${ root }/${ repoName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', product: 'apps' | 'manager', id?: string) {
    super(ChartRepositoriesCreateEditPo.createPath(clusterId, product, id));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  gitRepoUrl(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Git Repo URL');
  }

  gitBranch(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Git Branch');
  }

  ociUrl() {
    return LabeledInputPo.byLabel(this.self(), 'OCI Repository Host URL');
  }

  ociMinWaitInput() {
    return new UnitInputPo('[data-testid="clusterrepo-oci-min-wait-input"]');
  }

  ociMaxWaitInput() {
    return new UnitInputPo('[data-testid="clusterrepo-oci-max-wait-input"]');
  }

  authentication(): LabeledSelectPo {
    return new LabeledSelectPo('.vs__dropdown-toggle');
  }

  repoRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="clusterrepo-radio-input"]');
  }

  lablesAnnotationsKeyValue() {
    return new KeyValuePo(this.self());
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  authSelectOrCreate(selector: string) {
    return new SelectOrCreateAuthPo(selector);
  }

  clusterRepoAuthSelectOrCreate() {
    return this.authSelectOrCreate('[data-testid="clusterrepo-auth-secret"]');
  }

  refreshIntervalInput() {
    return new UnitInputPo('[data-testid="clusterrepo-refresh-interval"]');
  }

  saveAndWaitForRequests(method: string, url: string) {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return cy.wait('@request', { timeout: 10000 });
  }
}
