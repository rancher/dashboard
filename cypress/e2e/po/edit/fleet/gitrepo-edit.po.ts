import PagePo from '@/cypress/e2e/po/pages/page.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import SelectOrCreateAuthPo from '@/cypress/e2e/po/components/select-or-create-auth.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

export class GitRepoEditPo extends PagePo {
  private static createPath(fleetWorkspace: string, gitRepoName: string) {
    return `/c/_/fleet/fleet.cattle.io.gitrepo/${ fleetWorkspace }/${ gitRepoName }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(fleetWorkspace: string, gitRepoName: string) {
    super(GitRepoEditPo.createPath(fleetWorkspace, gitRepoName));
  }

  title() {
    return this.self().get('.title .primaryheader  h1');
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
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

  footer() {
    return new CreateEditViewPo(this.self());
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
}
