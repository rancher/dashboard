import PagePo from '@/cypress/e2e/po/pages/page.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';

export default class RepositoriesCreateEditPo extends PagePo {
  private static createPath(clusterId: string, product: 'apps' | 'manager', repoName?: string ) {
    const root = `/c/${ clusterId }/${ product }/catalog.cattle.io.clusterrepo`;

    return repoName ? `${ root }/${ repoName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local', product: 'apps' | 'manager', id?: string) {
    super(RepositoriesCreateEditPo.createPath(clusterId, product, id));
  }

  name(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Name');
  }

  description(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Description');
  }

  gitRepoUrl(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Git Repo URL');
  }

  gitBranch(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Git Branch');
  }

  authentication(): LabeledSelectPo {
    return new LabeledSelectPo('.vs__dropdown-toggle');
  }

  repoRadioBtn(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="clusterrepo-radio-input"]');
  }

  saveCreateForm(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  saveAndWaitForRequests(method: string, url: string) {
    cy.intercept(method, url).as('request');
    this.saveCreateForm().click();

    return cy.wait('@request', { timeout: 10000 });
  }
}
