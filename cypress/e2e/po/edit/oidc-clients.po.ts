import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import UnitInputPo from '@/cypress/e2e/po/components/unit-input.po';
import CopyToClipboardTextPo from '@/cypress/e2e/po/components/copy-to-clipboard-text.po';

export default class OidcClientsCreateEditPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/auth/management.cattle.io.oidcclient/create`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(OidcClientsCreateEditPo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(OidcClientsCreateEditPo.createPath(clusterId));
  }

  applicationName() {
    return new LabeledInputPo('[data-testid="oidc-client-app-name-field"]');
  }

  applicationDescription() {
    return new LabeledInputPo('[data-testid="oidc-client-app-desc-field"]');
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

  //   addWhitelistDomain(domain: string, idx: number) {
  //     return new ArrayListPo('[data-testid="driver-create-whitelist-list"]').setValueAtIndex(domain, idx);
  //   }

  saveCreateForm(): ResourceDetailPo {
    return new ResourceDetailPo(this.self());
  }
}
