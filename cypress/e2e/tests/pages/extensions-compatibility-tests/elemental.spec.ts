import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';

import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';

const EXTENSION_NAME = 'elemental';

describe('Extensions Compatibility spec', { tags: ['@elemental', '@adminUser'] }, () => {
  before(() => {
    cy.login();

    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    extensionsPo.waitForPage();

    // install extensions operator if it's not installed
    extensionsPo.installExtensionsOperatorIfNeeded();

    // install the rancher plugin examples
    extensionsPo.addExtensionsRepository('https://github.com/rancher/ui-plugin-charts', 'main', 'rancher-extensions');
  });

  beforeEach(() => {
    cy.login();
  });

  // TODO: TO REMOVE ONCE EVERYTHING IS GOOD!
  it('can navigate to About page (get version from about page screenshots to make sure we are on the right system)', () => {
    const aboutPage = new AboutPagePo();

    HomePagePo.goToAndWaitForGet();
    AboutPagePo.navTo();
    aboutPage.waitForPage();
    cy.wait(5000); // eslint-disable-line cypress/no-unnecessary-waiting
    // just enough to render the page on sorry-cypress so that we can check the version
  });

  it('Should install an extension', () => {
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();

    extensionsPo.extensionTabAvailableClick();

    // click on install button on card
    extensionsPo.extensionCardInstallClick(EXTENSION_NAME);
    extensionsPo.extensionInstallModal().should('be.visible');

    // select version and click install
    extensionsPo.installModalSelectVersionClick(2);
    extensionsPo.installModalInstallClick();

    // let's check the extension reload banner and reload the page
    extensionsPo.extensionReloadBanner().should('be.visible');
    extensionsPo.extensionReloadClick();

    // make sure extension card is in the installed tab
    extensionsPo.extensionTabInstalledClick();
    extensionsPo.extensionCardClick(EXTENSION_NAME);
    extensionsPo.extensionDetailsTitle().should('contain', EXTENSION_NAME);
    extensionsPo.extensionDetailsCloseClick();
  });
});
