import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import UnitInputPo from '@/cypress/e2e/po/components/unit-input.po';
import CopyToClipboardTextPo from '@/cypress/e2e/po/components/copy-to-clipboard-text.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu-shell.po';
import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

export default class OidcClientsCreateEditPo extends PagePo {
  private static createPath(clusterId: string, oidcClientId?: string, isEdit?: boolean) {
    const root = `/c/${ clusterId }/auth/management.cattle.io.oidcclient`;

    return oidcClientId ? `${ root }/${ oidcClientId }${ isEdit ? '?mode=edit' : '' }` : `${ root }/create`;
  }

  static goTo(clusterId: string, oidcClientId?: string, isEdit?: boolean): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(OidcClientsCreateEditPo.createPath(clusterId, oidcClientId, isEdit));
  }

  constructor(clusterId = 'local', oidcClientId = '', isEdit = false) {
    super(OidcClientsCreateEditPo.createPath(clusterId, oidcClientId, isEdit));
  }

  nameNsDescription() {
    return new NameNsDescription(this.self());
  }

  callbackUrls() {
    return new ArrayListPo('[data-testid="oidc-client-cb-urls-list"]');
  }

  refreshTokenExpiration() {
    return new UnitInputPo('[data-testid="oidc-client-ref-token-exp-input"]');
  }

  tokenExpiration() {
    return new UnitInputPo('[data-testid="oidc-client-token-exp-input"]');
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

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }
}
