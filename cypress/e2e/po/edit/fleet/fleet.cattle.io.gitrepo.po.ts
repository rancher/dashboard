import { BaseDetailPagePo } from '@/cypress/e2e/po/pages/base/base-detail-page.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';

export class GitRepoCreateEditPo extends BaseDetailPagePo {
  private static createPath(fleetWorkspace?: string, gitRepoName?: string) {
    const root = `/c/_/fleet/fleet.cattle.io.gitrepo`;

    return fleetWorkspace ? `${ root }/${ fleetWorkspace }/${ gitRepoName }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace?: string, gitRepoName?: string) {
    super(GitRepoCreateEditPo.createPath(fleetWorkspace, gitRepoName));
  }

  setBranchName(branch = 'dashboard-e2e-basic') {
    return LabeledInputPo.byLabel(this.self(), 'Branch').set(branch);
  }

  setGitRepoUrl(url: string) {
    return LabeledInputPo.byLabel(this.self(), 'Repository URL').set(url);
  }

  setHelmRepoURLRegex(regexStr = 'https://charts.rancher.io/*') {
    return LabeledInputPo.bySelector(this.self(), '[data-testid="gitrepo-helm-repo-url-regex"]').set(regexStr);
  }

  setGitRepoPath(path: string, index = 0) {
    return this.gitRepoPaths().setValueAtIndex(path, index);
  }

  targetCluster(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="fleet-gitrepo-target-cluster"]');
  }

  gitRepoPaths() {
    return new ArrayListPo('[data-testid="gitRepo-paths"]');
  }

  authSelectOrCreate(selector: string) {
    return new SelectOrCreateAuthPo(selector);
  }

  helmAuthSelectOrCreate() {
    return this.authSelectOrCreate('[data-testid="gitrepo-helm-auth"]');
  }

  gitAuthSelectOrCreate() {
    return this.authSelectOrCreate('[data-testid="gitrepo-git-auth"]');
  }

  setPollingInterval(value: number) {
    return LabeledInputPo.byLabel(this.self(), 'Polling Interval').set(value);
  }

  displayAlwaysKeepInformationMessage() {
    this.self().get('[data-testid="checkbox-info-icon"]').eq(0).as('always');

    cy.get('@always').realHover();
    cy.get('@always').should('have.attr', 'data-popper-shown');
  }

  displayPollingInvervalTimeInformationMessage() {
    this.self().get('[data-testid="checkbox-info-icon"]').eq(1).as('polling');

    cy.get('@polling').realHover();
    cy.get('@polling').should('have.attr', 'data-popper-shown');
  }

  displaySelfHealingInformationMessage() {
    this.self().get('[data-testid="labeledTooltip-info-icon"]').eq(0).as('selfhealingicon');

    cy.get('@selfhealingicon').realHover();
    cy.get('@selfhealingicon').should('have.attr', 'data-popper-shown');
  }
}
