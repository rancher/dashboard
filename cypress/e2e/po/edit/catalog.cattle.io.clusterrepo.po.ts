import PagePo from '@/cypress/e2e/po/pages/page.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

/**
 * Covers core functionality that's common to the dashboard's import or create cluster pages
 */
export default class AppClusterRepoEditPo extends PagePo {
  private static createPath(clusterId: string, type = 'create') {
    return `/c/${ clusterId }/apps/catalog.cattle.io.clusterrepo/${ type }`;
  }

  static goTo(clusterId: string, type = 'create'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AppClusterRepoEditPo.createPath(clusterId, type));
  }

  constructor(clusterId: string, type = 'create') {
    super(AppClusterRepoEditPo.createPath(clusterId, type));
  }

  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }

  // Form
  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  selectRadioOptionGitRepo(index: number): Cypress.Chainable {
    const radioButton = new RadioGroupInputPo('[data-testid="clusterrepo-radio-input"]');

    return radioButton.set(index);
  }

  enterGitRepoName(name: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-git-repo-input"]').set(name);
  }

  enterGitBranchName(name: string) {
    return new LabeledInputPo('[data-testid="clusterrepo-git-branch-input"]').set(name);
  }

  create() {
    return this.resourceDetail().createEditView().create();
  }

  save() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]').click();
  }
}
