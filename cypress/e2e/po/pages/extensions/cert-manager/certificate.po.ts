import PagePo from '@/cypress/e2e/po/pages/page.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';
import NameNsDescriptionPo from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import ArrayListPo from '@/cypress/e2e/po/components/array-list.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

/**
 * The cert-manager Certificate create/edit form. Certificates are a namespaced resource under the
 * explorer product, so the create page lives at
 * `/c/<cluster>/explorer/cert-manager.io.certificate/create`.
 */
export default class CertificateCreatePo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/explorer/cert-manager.io.certificate/create`;
  }

  static goTo(clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(CertificateCreatePo.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(CertificateCreatePo.createPath(clusterId));
  }

  cruResource() {
    return new CruResourcePo('.dashboard-root');
  }

  nameNsDescription() {
    return new NameNsDescriptionPo(this.self());
  }

  saveButton(): AsyncButtonPo {
    return this.cruResource().saveOrCreate();
  }

  issuerKind(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="cert-manager-certificate-issuer-kind"]');
  }

  issuerSelect(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="cert-manager-certificate-issuer"]');
  }

  secretName(): LabeledInputPo {
    // LabeledInput sets `inheritAttrs: false` and binds `$attrs` onto the <input>, so the
    // data-testid lands on the input itself - not a wrapper.
    return new LabeledInputPo(this.self().find('[data-testid="cert-manager-certificate-secret-name"]'));
  }

  commonName(): LabeledInputPo {
    return new LabeledInputPo(this.self().find('[data-testid="cert-manager-certificate-common-name"]'));
  }

  dnsNames(): ArrayListPo {
    // Pass a function (not a resolved chainable): ArrayList's setValueAtIndex calls self() more
    // than once - clickAdd advances the subject to the Add button, so a stored chainable would
    // then scope the box lookup to that button. A function re-queries the container each time.
    return new ArrayListPo(() => this.self().find('[data-testid="cert-manager-certificate-dns-names"]'));
  }

  /** The warning shown when the selected namespace has no Issuers. */
  noIssuersBanner(): BannersPo {
    return new BannersPo(() => this.self().find('.banner.warning'));
  }
}
