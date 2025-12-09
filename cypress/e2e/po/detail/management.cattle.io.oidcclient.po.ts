import PagePo from '@/cypress/e2e/po/pages/page.po';
import CopyToClipboardTextPo from '@/cypress/e2e/po/components/copy-to-clipboard-text.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';

export default class OIDCClientDetailPo extends PagePo {
  private static createPath(clusterId: string, id: string): string {
    return `/c/${ clusterId }/auth/management.cattle.io.oidcclient/${ id }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', id: string) {
    super(OIDCClientDetailPo.createPath(clusterId, id));
  }

  clientID() {
    return new CopyToClipboardTextPo('[data-testid="oidc-clients-copy-clipboard-client-id"]');
  }

  clientFullSecretCopy(index: number) {
    return new CopyToClipboardTextPo(`[data-testid="oidc-client-secret-${ index }-copy-full-secret"]`);
  }

  addNewSecretBtnClick() {
    return cy.get('[data-testid="oidc-client-add-new-secret"]').click();
  }

  secretCardActionMenuToggle(index: number) {
    return cy.get(`[data-testid="oidc-client-secret-${ index }-action-menu"]`).click();
  }

  secretCardMenu() {
    return new ActionMenuPo();
  }
}
