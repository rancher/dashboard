import PagePo from '@/cypress/e2e/po/pages/page.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';

export default class IngressPageCreateEditPo extends PagePo {
  private static createPath(clusterId: string, id?: string ) {
    const root = `/c/${ clusterId }/explorer/storage.k8s.io.storageclass/create`;

    return id ? `${ root }/${ id }` : `${ root }/create`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', id?: string) {
    super(IngressPageCreateEditPo.createPath(clusterId, id));
  }

  editAsYaml() {
    return new AsyncButtonPo('[data-testid="form-yaml"]', this.self());
  }

  yamlEditor(): CodeMirrorPo {
    return CodeMirrorPo.bySelector(this.self(), '[data-testid="yaml-editor-code-mirror"]');
  }
}
