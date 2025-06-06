import { IngressListPagePo, IngressCreateEditPo } from '@/cypress/e2e/po/pages/explorer/ingress.po';
import { generateIngressesDataSmall, ingressesNoData } from '@/cypress/e2e/blueprints/explorer/workloads/service-discovery/ingresses-get';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';

const cluster = 'local';
const ingressListPagePo = new IngressListPagePo();
let ingressName = '';
const secretsNamesList = [];
const servicesNamesList = [];
const secretsCount = 4;
const servicesCount = 4;
const namespace = 'default';

describe('Ingresses', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('does not show console warning due to lack of secondary schemas needed to load data on list view', () => {
    // pattern as per https://docs.cypress.io/faq/questions/using-cypress-faq#How-do-I-spy-on-consolelog
    cy.visit(ingressListPagePo.urlPath(), {
      onBeforeLoad(win) {
        cy.stub(win.console, 'warn').as('consoleWarn');
      },
    });

    const warnMsg = "pathExistsInSchema requires schema networking.k8s.io.ingress to have resources fields via schema definition but none were found. has the schema 'fetchResourceFields' been called?";

    // testing https://github.com/rancher/dashboard/issues/11086
    cy.get('@consoleWarn').should('not.be.calledWith', warnMsg);

    cy.title().should('eq', 'Rancher - local - Ingresses');
  });

  it('can open "Edit as YAML"', () => {
    ingressListPagePo.goTo();
    ingressListPagePo.baseResourceList().masthead().create();

    const ingressCreatePagePo = new IngressCreateEditPo();

    ingressCreatePagePo.resourceDetail().createEditView().editAsYaml();
    ingressCreatePagePo.resourceDetail().resourceYaml().codeMirror().checkExists();
  });

  describe('Create/Edit', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.createE2EResourceName('ingress').then((name) => {
        ingressName = name;
      });

      // Create secrets
      cy.wrap(Array.from({ length: secretsCount }))
        .each(() => {
          const secretName = Cypress._.uniqueId(`e2e-${ Date.now().toString() }-secret`);

          cy.createSecret(namespace, secretName).then((name) => {
            secretsNamesList.push(name);
          });
        })
        .then(() => {
          // Create services
          cy.wrap(Array.from({ length: servicesCount }))
            .each(() => {
              const serviceName = Cypress._.uniqueId(`e2e-${ Date.now().toString() }-service`);

              cy.createService(namespace, serviceName).then((name) => {
                servicesNamesList.push(name);
              });
            });
        });
    });

    it('can select rules and certificates in Create mode', () => {
      cy.viewport(1440, 900);

      cy.intercept('GET', `/v1/secrets/${ namespace }?*`).as('getsSecrets');
      cy.intercept('GET', `/v1/services/${ namespace }?*`).as('getsServices');

      ingressListPagePo.goTo();
      ingressListPagePo.waitForPage();
      ingressListPagePo.list().resourceTable().sortableTable().checkVisible();
      ingressListPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      ingressListPagePo.baseResourceList().masthead().create();

      const ingressCreatePagePo = new IngressCreateEditPo();

      cy.wait('@getsServices').its('response.statusCode').should('eq', 200);
      cy.wait('@getsSecrets').its('response.statusCode').should('eq', 200);

      ingressCreatePagePo.waitForPage(null, 'rules');
      ingressCreatePagePo.resourceDetail().createEditView().nameNsDescription().name()
        .set(ingressName);
      ingressCreatePagePo.resourceDetail().createEditView().nameNsDescription().description()
        .set(`${ ingressName } description`);

      // Add two rules
      ingressCreatePagePo.setRuleRequestHostValue(0, 'example1.com');
      ingressCreatePagePo.setPathTypeByLabel(0, 'ImplementationSpecific');
      ingressCreatePagePo.setTargetServiceValueByLabel(0, servicesNamesList[0]);
      ingressCreatePagePo.setPortValueByLabel(0, '8080');
      ingressCreatePagePo.rulesList().clickAdd('Add Rule');
      ingressCreatePagePo.setRuleRequestHostValue(1, 'example2.com');
      ingressCreatePagePo.setPathTypeByLabel(1, 'ImplementationSpecific');
      ingressCreatePagePo.setTargetServiceValueByLabel(1, servicesNamesList[1]);
      ingressCreatePagePo.setPortValueByLabel(1, '8080');

      // Add two certificates
      ingressCreatePagePo.resourceDetail().tabs().clickTabWithName('certificates');
      ingressCreatePagePo.waitForPage(null, 'certificates');
      ingressCreatePagePo.certificatesList().clickAdd('Add Certificate');
      ingressCreatePagePo.setSecretNameValueByLabel(0, secretsNamesList[0]);
      ingressCreatePagePo.setHostValueByIndex(0, 'bar0');
      ingressCreatePagePo.certificatesList().clickAdd('Add Certificate');
      ingressCreatePagePo.setSecretNameValueByLabel(1, secretsNamesList[1]);
      ingressCreatePagePo.setHostValueByIndex(1, 'bar1');

      ingressCreatePagePo.resourceDetail().createEditView().saveAndWaitForRequests('POST', 'v1/networking.k8s.io.ingresses')
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(201);
          expect(response?.body.metadata).to.have.property('name', ingressName);

          // Validate rules
          expect(response?.body.spec).to.have.property('rules').that.is.an('array').with.length(2);
          expect(response?.body.spec.rules[0]).to.have.property('host', 'example1.com');
          expect(response?.body.spec.rules[1]).to.have.property('host', 'example2.com');

          // Validate TLS certificates
          expect(response?.body.spec).to.have.property('tls').that.is.an('array').with.length(2);
          expect(response?.body.spec.tls[0]).to.have.property('secretName', secretsNamesList[0]);
          expect(response?.body.spec.tls[1]).to.have.property('secretName', secretsNamesList[1]);
        });
      ingressListPagePo.waitForPage();
      ingressListPagePo.list().resourceTable().sortableTable().rowWithName(ingressName)
        .checkVisible();
    });

    it('can select rules and certificates in Edit mode', () => {
      cy.viewport(1440, 900);
      cy.intercept('GET', `/v1/secrets/${ namespace }?*`).as('getsSecrets');
      cy.intercept('GET', `/v1/services/${ namespace }?*`).as('getsServices');

      ingressListPagePo.goTo();
      ingressListPagePo.waitForPage();
      ingressListPagePo.list().resourceTable().sortableTable().rowWithName(ingressName)
        .checkVisible();
      ingressListPagePo.list().actionMenu(ingressName).getMenuItem('Edit Config').click();

      const ingressEditPage = new IngressCreateEditPo('local', namespace, ingressName);

      cy.wait('@getsServices').its('response.statusCode').should('eq', 200);
      cy.wait('@getsSecrets').its('response.statusCode').should('eq', 200);

      // Add two more rules
      ingressEditPage.waitForPage('mode=edit', 'rules');
      ingressEditPage.rulesList().clickAdd('Add Rule');
      ingressEditPage.setRuleRequestHostValue(2, 'example3.com');
      ingressEditPage.setPathTypeByLabel(2, 'ImplementationSpecific');
      ingressEditPage.setTargetServiceValueByLabel(2, servicesNamesList[2]);
      ingressEditPage.setPortValueByLabel(2, '8080');
      ingressEditPage.rulesList().clickAdd('Add Rule');
      ingressEditPage.setRuleRequestHostValue(3, 'example4.com');
      ingressEditPage.setPathTypeByLabel(3, 'ImplementationSpecific');
      ingressEditPage.setTargetServiceValueByLabel(3, servicesNamesList[3]);
      ingressEditPage.setPortValueByLabel(3, '8080');

      // Add two more certificates
      ingressEditPage.resourceDetail().tabs().clickTabWithName('certificates');
      ingressEditPage.waitForPage('mode=edit', 'certificates');
      ingressEditPage.certificatesList().clickAdd('Add Certificate');
      ingressEditPage.setSecretNameValueByLabel(2, secretsNamesList[2]);
      ingressEditPage.setHostValueByIndex(2, 'bar2');
      ingressEditPage.certificatesList().clickAdd('Add Certificate');
      ingressEditPage.setSecretNameValueByLabel(3, secretsNamesList[3]);
      ingressEditPage.setHostValueByIndex(3, 'bar3');

      ingressEditPage.resourceDetail().createEditView().saveAndWaitForRequests('PUT', `/v1/networking.k8s.io.ingresses/${ namespace }/${ ingressName }`)
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(response?.body.metadata).to.have.property('name', ingressName);

          // Validate all four rules
          expect(response?.body.spec).to.have.property('rules').that.is.an('array').with.length(4);
          response?.body.spec.rules.forEach((rule, index) => {
            expect(rule).to.have.property('host', `example${ index + 1 }.com`);
            expect(rule).to.have.property('http').that.has.property('paths').that.is.an('array').with.length(1);
            const path = rule.http.paths[0];

            expect(path).to.have.property('pathType', 'ImplementationSpecific');
            expect(path.backend.service).to.deep.include({
              name: servicesNamesList[index],
              port: { number: 8080 }
            });
          });

          // Validate all four certificates
          expect(response?.body.spec).to.have.property('tls').that.is.an('array').with.length(4);
          response?.body.spec.tls.forEach((tlsEntry, index) => {
            expect(tlsEntry).to.have.property('hosts').that.is.an('array').with.length(1);
            expect(tlsEntry.hosts[0]).to.equal(`bar${ index }`);
            expect(tlsEntry).to.have.property('secretName', secretsNamesList[index]);
          });
        });
      ingressListPagePo.waitForPage();
      ingressListPagePo.list().resourceTable().sortableTable().rowWithName(ingressName)
        .checkVisible();
    });
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter(cluster, 'none', '{\"local\":[]}');
    });

    it('validate services table in empty state', () => {
      ClusterDashboardPagePo.goToAndConfirmNsValues(cluster, { all: { is: true } });

      ingressesNoData();
      IngressListPagePo.navTo();
      ingressListPagePo.waitForPage();
      cy.wait('@ingressesNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Default', 'Ingress Class', 'Age'];

      ingressListPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      ingressListPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate ingresses table', () => {
      generateIngressesDataSmall();
      ingressListPagePo.goTo();
      ingressListPagePo.waitForPage();
      cy.wait('@ingressesDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Target', 'Default', 'Ingress Class', 'Age'];

      ingressListPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      ingressListPagePo.list().resourceTable().sortableTable().checkVisible();
      ingressListPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      ingressListPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      ingressListPagePo.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });

    it('group by namespace: validate ingresses table', () => {
      generateIngressesDataSmall();
      ingressListPagePo.goTo();
      ingressListPagePo.waitForPage();
      cy.wait('@ingressesDataSmall');

      // group by namespace
      ingressListPagePo.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Target', 'Default', 'Ingress Class', 'Age'];

      ingressListPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      ingressListPagePo.list().resourceTable().sortableTable().checkVisible();
      ingressListPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      ingressListPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      ingressListPagePo.list().resourceTable().sortableTable().groupElementWithName('Namespace: cattle-system')
        .should('be.visible');
      ingressListPagePo.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });

    after('clean up', () => {
      cy.updateNamespaceFilter(cluster, 'none', '{"local":["all://user"]}');

      // clean up secrets, services and ingress
      secretsNamesList.forEach((secretName) => {
        cy.deleteRancherResource('v1', 'secrets', `${ namespace }/${ secretName }`);
      });

      servicesNamesList.forEach((serviceName) => {
        cy.deleteRancherResource('v1', 'services', `${ namespace }/${ serviceName }`);
      });

      cy.deleteRancherResource('v1', 'networking.k8s.io.ingresses', `${ namespace }/${ ingressName }`);
    });
  });
});
