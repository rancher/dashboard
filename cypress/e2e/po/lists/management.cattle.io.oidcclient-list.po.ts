import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';
import CopyToClipboardTextPo from '@/cypress/e2e/po/components/copy-to-clipboard-text.po';

export default class OidcClientsListPo extends BaseResourceList {
  details(name: string, index: number) {
    return this.resourceTable().sortableTable().rowWithName(name).column(index);
  }

  title() {
    return this.masthead().title();
  }

  issuerURL() {
    return new CopyToClipboardTextPo('[data-testid="oidc-clients-copy-clipboard-issuer-url"]');
  }

  discoveryDocument() {
    return new CopyToClipboardTextPo('[data-testid="oidc-clients-copy-clipboard-discovery-document"]');
  }

  jwksURI() {
    return new CopyToClipboardTextPo('[data-testid="oidc-clients-copy-clipboard-jwks-uri"]');
  }
}
