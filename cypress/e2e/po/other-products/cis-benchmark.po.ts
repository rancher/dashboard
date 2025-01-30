import PagePo from '@/cypress/e2e/po/pages/page.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';
import ResourceListMastheadPo from '@/cypress/e2e/po/components/ResourceList/resource-list-masthead.po';
import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';

export class CisBenchmarkListPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/cis/cis.cattle.io.clusterscan`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CisBenchmarkListPo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(CisBenchmarkListPo.createPath(clusterId));
  }

  masthead() {
    return new ResourceListMastheadPo(this.self());
  }

  createScan() {
    return this.masthead().create();
  }

  listElementWithName(name:string) {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().rowElementWithName(name);
  }

  firstRow() {
    const baseResourceList = new BaseResourceList(this.self());

    return baseResourceList.resourceTable().sortableTable().row(0);
  }
}

export class CisBenchmarkPo extends PagePo {
    static url: string;

    private static createPath( clusterId: string, name: string ) {
      const urlStr = `/c/${ clusterId }/cis/cis.cattle.io.clusterscan/${ name }`;

      return urlStr;
    }

    static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
      return super.goTo(this.url);
    }

    constructor(clusterId = 'local', name = 'create') {
      super(CisBenchmarkPo.createPath(clusterId, name));

      CisBenchmarkPo.url = CisBenchmarkPo.createPath(clusterId, name);
    }

    cruResource() {
      return new CruResourcePo(this.self());
    }

    nameNsDescription() {
      return new NameNsDescription(this.self());
    }

    yamlEditor(): CodeMirrorPo {
      return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
    }
}
