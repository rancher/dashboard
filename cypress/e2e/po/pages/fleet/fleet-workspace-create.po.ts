import PagePo from '@/cypress/e2e/po/pages/page.po';
import CreateEditViewPo from '@/cypress/e2e/po/components/create-edit-view.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export class GitRepoCreatePo extends PagePo {
    static url: string;

    private static createPath(
      clusterId: string,
      queryParams?: Record<string, string>
    ) {
      const urlStr = `/c/${ clusterId }/fleet/management.cattle.io.fleetworkspace/create`;

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

    footer() {
      return new CreateEditViewPo(this.self());
    }

    setWorkspaceName(name: string) {
      return LabeledInputPo.byLabel(this.self(), 'Name').set(name);
    }

    create() {
      return this.footer().create();
    }
}
