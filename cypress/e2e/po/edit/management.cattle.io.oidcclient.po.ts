import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import UnitInputPo from '@/cypress/e2e/po/components/unit-input.po';

import NameNsDescription from '@/cypress/e2e/po/components/name-ns-description.po';

export default class OidcClientCreateEditPo extends PagePo {
  private static createPath(clusterId: string, oidcClientId?: string, isEdit?: boolean) {
    const root = `/c/${ clusterId }/auth/management.cattle.io.oidcclient`;

    return oidcClientId ? `${ root }/${ oidcClientId }${ isEdit ? '?mode=edit' : '' }` : `${ root }/create`;
  }

  static goTo(clusterId: string, oidcClientId?: string, isEdit?: boolean): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(OidcClientCreateEditPo.createPath(clusterId, oidcClientId, isEdit));
  }

  constructor(clusterId = '_', oidcClientId = '', isEdit = false) {
    super(OidcClientCreateEditPo.createPath(clusterId, oidcClientId, isEdit));
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

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }
}
