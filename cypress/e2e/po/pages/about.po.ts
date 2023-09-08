import PagePo from '@/cypress/e2e/po/pages/page.po';

/**
 * About page
 */
export default class AboutPagePo extends PagePo {
  static url = '/about'

  constructor(pageUrl = AboutPagePo.url) {
    AboutPagePo.url = pageUrl;
    super(AboutPagePo.url);
  }

  diagnosticsBtn() {
    return cy.getId('about__diagnostics_button');
  }

  links(value: string): Cypress.Chainable {
    return this.self().get('a').contains(value);
  }

  getLinkDestination(value: string): Cypress.Chainable {
    return this.links(value).invoke('prop', 'href');
  }

  clickVersionLink(value: string) {
    this.links(value).then((el) => {
      expect(el).to.have.attr('target');
    }).invoke('removeAttr', 'target')
      .click();
  }

  getLinuxDownloadLink() {
    return cy.getId('image_list__about.os.linux');
  }

  getWindowsDownloadLink() {
    return cy.getId('image_list__about.os.windows');
  }

  getMacCliDownloadLink() {
    return cy.getId('cli_downloads__about.os.mac');
  }

  getLinuxCliDownloadLink() {
    return cy.getId('cli_downloads__about.os.linux');
  }

  getWindowsCliDownloadLink() {
    return cy.getId('cli_downloads__about.os.windows');
  }
}
