import { ServicesPagePo } from '@/cypress/e2e/po/pages/explorer/services.po';
import { generateServicesDataSmall, servicesNoData } from '@/cypress/e2e/blueprints/explorer/workloads/service-discovery/services-get';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { GrowlManagerPo } from '@/cypress/e2e/po/components/growl-manager.po';

const servicesPagePo = new ServicesPagePo();
const growlPo = new GrowlManagerPo();
const cluster = 'local';
let serviceExternalName = '';
const namespace = 'default';
let removeServices = false;
const servicesToDelete = [];

describe('Services', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    cy.createE2EResourceName('serviceexternalname').then((name) => {
      serviceExternalName = name;
    });
  });

  describe('CRUD', () => {
    it('can create an ExternalName Service', () => {
      cy.intercept('POST', '/v1/services').as('createService');
      ServicesPagePo.navTo();
      servicesPagePo.waitForPage();
      servicesPagePo.clickCreate();
      servicesPagePo.createServicesForm().waitForPage();

      servicesPagePo.createServicesForm().selectServiceOption(1);
      servicesPagePo.createServicesForm().waitForPage(null, 'define-external-name');
      servicesPagePo.createServicesForm().resourceDetail().title().should('contain', 'Create ExternalName');
      servicesPagePo.createServicesForm().nameNsDescription().name().set(serviceExternalName);
      servicesPagePo.createServicesForm().nameNsDescription().description().set(`${ serviceExternalName }-desc`);
      servicesPagePo.createServicesForm().selectNamespace(namespace);
      servicesPagePo.createServicesForm().tabs().allTabs().should('have.length', 3);

      const tabs = ['External Name', 'IP Addresses', 'Labels & Annotations'];

      servicesPagePo.createServicesForm().tabs().tabNames().each((el, i) => {
        expect(el).to.eq(tabs[i]);
      });

      servicesPagePo.createServicesForm().tabs().assertTabIsActive('[data-testid="define-external-name"]');
      servicesPagePo.createServicesForm().externalNameInput().set('my.database.example.com');
      servicesPagePo.createServicesForm().ipAddressesTab();
      servicesPagePo.createServicesForm().waitForPage(null, 'ips');
      servicesPagePo.createServicesForm().ipAddressList().setValueAtIndex('1.1.1.1', 0);
      servicesPagePo.createServicesForm().ipAddressList().setValueAtIndex('2.2.2.2', 1);
      servicesPagePo.createServicesForm().lablesAnnotationsTab();
      servicesPagePo.createServicesForm().waitForPage(null, 'labels-and-annotations');
      servicesPagePo.createServicesForm().lablesAnnotationsKeyValue().setKeyValueAtIndex('Add Label', 'label-key1', 'label-value1', 0, '.labels-and-annotations-container div.row:nth-of-type(2)');

      // Adding Annotations doesn't work via test automation
      // See https://github.com/rancher/dashboard/issues/13191
      // servicesPagePo.createServicesForm().lablesAnnotationsKeyValue().setKeyValueAtIndex('Add Annotation', 'ann-key1', 'ann-value1', 0, '.labels-and-annotations-container div.row:nth-of-type(3)');
      servicesPagePo.createServicesForm().resourceDetail().createEditView().create();
      cy.wait('@createService').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeServices = true;
        servicesToDelete.push(`${ namespace }/${ serviceExternalName }`);
      });
      servicesPagePo.waitForPage();
      servicesPagePo.list().resourceTable().sortableTable().rowWithName(serviceExternalName)
        .checkVisible();
      growlPo.dismissWarning();
    });

    it('can edit an ExternalName Service', () => {
      ServicesPagePo.navTo();
      servicesPagePo.waitForPage();
      servicesPagePo.list().actionMenu(serviceExternalName).getMenuItem('Edit Config').click();
      servicesPagePo.createServicesForm(namespace, serviceExternalName).waitForPage('mode=edit', 'define-external-name');
      servicesPagePo.createServicesForm().nameNsDescription().description().set(`${ serviceExternalName }-desc`);
      servicesPagePo.createServicesForm().resourceDetail().cruResource().saveAndWaitForRequests('PUT', `/v1/services/${ namespace }/${ serviceExternalName }`)
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(response?.body.metadata).to.have.property('name', serviceExternalName);
          expect(response?.body.metadata.annotations).to.have.property('field.cattle.io/description', `${ serviceExternalName }-desc`);
        });
      servicesPagePo.waitForPage();
      growlPo.dismissWarning();
    });

    it('can clone an ExternalName Service', () => {
      ServicesPagePo.navTo();
      servicesPagePo.waitForPage();
      servicesPagePo.list().actionMenu(serviceExternalName).getMenuItem('Clone').click();
      servicesPagePo.createServicesForm(namespace, serviceExternalName).waitForPage('mode=clone', 'define-external-name');
      servicesPagePo.createServicesForm().nameNsDescription().name().set(`clone-${ serviceExternalName }`);
      servicesPagePo.createServicesForm().resourceDetail().cruResource().saveAndWaitForRequests('POST', '/v1/services')
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(response?.body.metadata).to.have.property('name', `clone-${ serviceExternalName }`);
          removeServices = true;
          servicesToDelete.push(`${ namespace }/clone-${ serviceExternalName }`);
        });
      servicesPagePo.waitForPage();
      servicesPagePo.list().resourceTable().sortableTable().rowWithName(`clone-${ serviceExternalName }`)
        .checkVisible();
      growlPo.dismissWarning();
    });

    it('can Edit Yaml', () => {
      ServicesPagePo.navTo();
      servicesPagePo.waitForPage();
      servicesPagePo.list().actionMenu(`clone-${ serviceExternalName }`).getMenuItem('Edit YAML').click();
      servicesPagePo.createServicesForm(namespace, `clone-${ serviceExternalName }`).waitForPage('mode=edit&as=yaml');
      servicesPagePo.createServicesForm().title().contains(`Service: clone-${ serviceExternalName }`).should('be.visible');
    });

    it('can delete an ExternalName Service', () => {
      ServicesPagePo.navTo();
      servicesPagePo.waitForPage();
      servicesPagePo.list().actionMenu(`clone-${ serviceExternalName }`).getMenuItem('Delete').click();
      servicesPagePo.list().resourceTable().sortableTable().rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v1/services/${ namespace }/clone-${ serviceExternalName }`).as('deleteService');

          promptRemove.remove();
          cy.wait('@deleteService');
          servicesPagePo.waitForPage();
          servicesPagePo.list().resourceTable().sortableTable().checkRowCount(false, rows.length - 1);
          servicesPagePo.list().resourceTable().sortableTable().rowNames('.col-link-detail')
            .should('not.contain', `clone-${ serviceExternalName }`);
        });
    });

    // testing https://github.com/rancher/dashboard/issues/11889
    it('validation errors should not be shown when form is just opened', () => {
      servicesPagePo.goTo();
      servicesPagePo.clickCreate();
      servicesPagePo.createServicesForm().errorBanner().should('not.exist');
    });

    after(() => {
      if (removeServices) {
        // delete gitrepo
        servicesToDelete.forEach((r) => cy.deleteRancherResource('v1', 'services', r, false));
      }
    });
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      ClusterDashboardPagePo.goToAndWait(cluster); // Ensure we're at a solid state before messing with preferences (given login/load might change them)
      cy.updateNamespaceFilter(cluster, 'none', '{\"local\":[]}');
    });

    it('validate services table in empty state', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } } );

      servicesNoData();
      ServicesPagePo.navTo();
      servicesPagePo.waitForPage();
      cy.wait('@servicesNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Selector', 'Type', 'Age'];

      servicesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      servicesPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate services table', () => {
      generateServicesDataSmall();
      servicesPagePo.goTo();
      servicesPagePo.waitForPage();
      cy.wait('@servicesDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Selector', 'Type', 'Age'];

      servicesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      servicesPagePo.list().resourceTable().sortableTable().checkVisible();
      servicesPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      servicesPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      servicesPagePo.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    it('group by namespace: validate services table', () => {
      generateServicesDataSmall();
      servicesPagePo.goTo();
      servicesPagePo.waitForPage();
      cy.wait('@servicesDataSmall');

      // group by namespace
      servicesPagePo.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Target', 'Selector', 'Type', 'Age'];

      servicesPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      servicesPagePo.list().resourceTable().sortableTable().checkVisible();
      servicesPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      servicesPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      servicesPagePo.list().resourceTable().sortableTable().groupElementWithName('Namespace: cattle-system')
        .scrollIntoView()
        .should('be.visible');
      servicesPagePo.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    after('clean up', () => {
      cy.updateNamespaceFilter(cluster, 'none', '{"local":["all://user"]}');
    });
  });
});
