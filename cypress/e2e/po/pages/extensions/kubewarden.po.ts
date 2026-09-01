import PagePo from '@/cypress/e2e/po/pages/page.po';
// import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';

export default class KubewardenExtensionPo extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/kubewarden`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = 'local') {
    super(KubewardenExtensionPo.createPath(clusterId));
  }

  /** add ui-plugin-charts repository */
  // addChartsRepoIfNeeded(): void {
  //   const extensionsPo: ExtensionsPagePo = new ExtensionsPagePo();

  //   extensionsPo.waitForPage();

  //   cy.get('body').then(($body: any) => {
  //     if ( $body.find('[data-testid="extension-card-kubewarden"]').length === 0 ) {
  //       extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-charts', 'main', 'rancher-extensions');
  //     }
  //   });
  // }
}
