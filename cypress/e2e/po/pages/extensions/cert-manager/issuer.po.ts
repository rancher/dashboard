import PagePo from '@/cypress/e2e/po/pages/page.po';
import CruResourcePo from '@/cypress/e2e/po/components/cru-resource.po';
import NameNsDescriptionPo from '@/cypress/e2e/po/components/name-ns-description.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

/**
 * The cert-manager Issuer / ClusterIssuer create/edit form. Both scopes share the same underlying
 * component (IssuerEdit); the only difference is the resource type in the route and whether the
 * name/namespace picker offers a namespace.
 */
export default class IssuerCreatePo extends PagePo {
  private static createPath(resourceType: string, clusterId: string) {
    return `/c/${ clusterId }/explorer/${ resourceType }/create`;
  }

  static goTo(resourceType = 'cert-manager.io.issuer', clusterId = 'local'): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(IssuerCreatePo.createPath(resourceType, clusterId));
  }

  constructor(resourceType = 'cert-manager.io.issuer', clusterId = 'local') {
    super(IssuerCreatePo.createPath(resourceType, clusterId));
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

  configType(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="cert-manager-issuer-config-type"]');
  }

  caSecretName(): LabeledInputPo {
    return new LabeledInputPo(this.self().find('[data-testid="cert-manager-issuer-ca-secret-name"]'));
  }

  acmeServer(): LabeledInputPo {
    return new LabeledInputPo(this.self().find('[data-testid="cert-manager-issuer-acme-server"]'));
  }

  acmePrivateKeySecret(): LabeledInputPo {
    return new LabeledInputPo(this.self().find('[data-testid="cert-manager-issuer-acme-private-key-secret"]'));
  }

  /** Banners rendered inside the form (self-signed help, the unsupported-type notice, ...). */
  banners() {
    return this.self().find('.banner');
  }
}
