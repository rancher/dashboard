import PagePo from '@/cypress/e2e/po/pages/page.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import { WorkspaceSwitcherPo } from '@/cypress/e2e/po/components/namespace-filter.po';

export class GitRepoCreatePo extends PagePo {
    static url: string;

    private static createPath(
      clusterId: string,
      queryParams?: Record<string, string>
    ) {
      const urlStr = `/c/${ clusterId }/fleet/fleet.cattle.io.gitrepo/create`;

      if (!queryParams) {
        return urlStr;
      }

      const params = new URLSearchParams(queryParams);

      return `${ urlStr }?${ params.toString() }`;
    }

    static goTo(clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
      return super.goTo(GitRepoCreatePo.createPath(clusterId));
    }

    constructor(clusterId: string) {
      super(GitRepoCreatePo.createPath(clusterId));
    }

    selectWorkspace(name: string) {
      const wsSwitcher = new WorkspaceSwitcherPo();

      wsSwitcher.toggle();

      return wsSwitcher.clickOptionWithLabel(name);
    }

    footer() {
      return new CreateEditViewPo(this.self());
    }

    setRepoName(name: string) {
      return LabeledInputPo.byLabel(this.self(), 'Name').set(name);
    }

    setBranchName(branch = 'dashboard-e2e-basic') {
      return LabeledInputPo.byLabel(this.self(), 'Branch').set(branch);
    }

    setGitRepoUrl(url: string) {
      return LabeledInputPo.byLabel(this.self(), 'Repository URL').set(url);
    }

    setGitRepoPath(path: string, index = 0) {
      return this.gitRepoPaths().setValueAtIndex(index, path);
    }

    goToNext() {
      return this.footer().nextPage();
    }

    create() {
      return this.footer().create();
    }

    gitRepoPaths() {
      return new ArrayListPo('[data-testid="gitRepo-paths"]');
    }
}
