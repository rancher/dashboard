import { BaseListPagePo } from '@/cypress/e2e/po/pages/base/base-list-page.po';
import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '~/cypress/e2e/po/components/labeled-select.po';

export class ProjectSecretsListPagePo extends BaseListPagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/projectsecret`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ProjectSecretsListPagePo.createPath(clusterId));
  }

  constructor(clusterId: string) {
    super(ProjectSecretsListPagePo.createPath(clusterId));
  }

  title() {
    return this.self().get('.title h1').invoke('text');
  }

  createButton() {
    return this.self().get('[data-testid="secrets-list-create"]');
  }

  createButtonTitle() {
    return this.createButton().invoke('text');
  }
}

export class ProjectSecretsCreateEditPo extends BaseDetailPagePo {
  private static createPath(clusterId: string, namespace?: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/projectsecret`;

    return id ? `${ root }/${ namespace }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId: string, namespace?: string, id?: string) {
    super(ProjectSecretsCreateEditPo.createPath(clusterId, namespace, id));
  }

  selectSecretSubtype(subtype: string) {
    return this.self().get(`[data-testid="subtype-banner-item-${ subtype }"]`);
  }

  projectSelect() {
    return new LabeledSelectPo('[data-testid="secret-project-select"]');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  basicAuthUsernameInput() {
    return new LabeledInputPo('[data-testid="secret-basic-username"]');
  }

  saveOrCreate(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="form-save"]', this.self());
  }
}
