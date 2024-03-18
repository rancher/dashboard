import { isMatch } from 'lodash';
import KontainerDriverListPagePo from '@/cypress/e2e/po/pages/cluster-manager/drivers/kontainer-driver-list.po';
import KontainerDriverEditPo from '~/cypress/e2e/po/edit/kontainerDriver.po';
import DeactivateDriverDialogPo from '@/cypress/e2e/po/dialog/DeactivateDriverDialog.po';

const type = 'kontainerDriver';
const name = 'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64'; // description can be used as name to find correct element

describe('Kontainer Drivers', { tags: ['@manager', '@adminUser'] }, () => {
  const driverList = new KontainerDriverListPagePo('local');
  const createDriverPage = new KontainerDriverEditPo('local');

  beforeEach(() => {
    cy.login();
    driverList.goTo();
  });
  it('should show the cluster drivers list page', () => {
    cy.contains('.title > h1', 'Cluster Drivers').should('be.visible');
    driverList.sortableTable().checkVisible();

    // Wait for loading indicator to go
    driverList.sortableTable().checkLoadingIndicatorNotVisible();
  });

  it('can create new driver', () => {
    cy.intercept('POST', `/v3/kontainerdrivers`).as('createRequest');
    const request = {
      type,
      active:   true,
      checksum: 'Aaaaa1111',
      url:      'https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64',
      uiUrl:    'https://test.com'
    };

    driverList.createDriver();

    createDriverPage.waitForPage();
    createDriverPage.enterUrl('https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64');
    createDriverPage.enterUiUrl('https://test.com');
    createDriverPage.enterChecksum('Aaaaa1111');

    createDriverPage.create();

    cy.wait('@createRequest').then((intercept) => {
      expect(isMatch(intercept.request.body, request)).to.equal(true);
    });
  });
  it('can deactivate driver', () => {
    const request = { };

    driverList.listElementWithName(name).find('.col-link-detail span').invoke('text').then((t) => {
      cy.intercept('POST', `/v3/kontainerDrivers/${ t }?action=deactivate`).as('createRequest');

      driverList.list().actionMenu(name).getMenuItem('Deactivate').click();
      const deactivateDialog = new DeactivateDriverDialogPo('local');

      deactivateDialog.deactivate();
    });
    cy.wait('@createRequest').then((intercept) => {
      expect(isMatch(intercept.request.body, request)).to.equal(true);
    });
  });
  it('can activate driver', () => {
    const request = { };

    driverList.listElementWithName(name).find('.col-link-detail span').invoke('text').then((t) => {
      cy.intercept('POST', `/v3/kontainerDrivers/${ t }?action=activate`).as('createRequest');

      driverList.list().actionMenu(name).getMenuItem('Activate').click();
    });
    cy.wait('@createRequest').then((intercept) => {
      expect(isMatch(intercept.request.body, request)).to.equal(true);
    });
  });
  after(() => {
    driverList.goTo();
    driverList.sortableTable().deleteItemWithUI('https://github.com/rancher-plugins/kontainer-engine-driver-example/releases/download/v0.2.3/kontainer-engine-driver-example-copy1-linux-amd64');
  });
});
