import { SecretsListPagePo, SecretsCreateEditPo } from '@/cypress/e2e/po/pages/explorer/secrets.po';

const localCluster = 'local';

const HELM_RELEASE_TYPE = 'helm.sh/release.v1';
// Not a real encoded release. The tests only check that these bytes survive a save unchanged
const RELEASE_DATA = btoa('e2e-helm-release');
const ADDED_LABEL = 'e2e-added';
const REMOVED_LABEL = 'e2e-removed';

const helmLabels = (app: string) => ({
  name: app, owner: 'helm', status: 'deployed', version: '1'
});

// Read the secret from the kube API directly, because Steve strips the release data of helm secrets
const getRawSecret = (namespace: string, name: string) => {
  return cy.request({ url: `${ Cypress.env('api') }/k8s/clusters/${ localCluster }/api/v1/namespaces/${ namespace }/secrets/${ name }` });
};

describe('Helm release secrets', { testIsolation: false, tags: ['@explorer2', '@adminUser'] }, () => {
  const secretsPage = new SecretsListPagePo(localCluster);
  let namespace: string;
  let app: string;
  let secretName: string;

  const navToEdit = () => {
    const editPage = new SecretsCreateEditPo(localCluster, namespace, secretName);

    SecretsListPagePo.navTo(localCluster);
    secretsPage.waitForPage();
    secretsPage.list().resourceTable().sortableTable().rowActionMenuOpen(secretName)
      .getMenuItem('Edit Config')
      .click();
    editPage.waitForPage('mode=edit');
    editPage.resourceDetail().cruResource().saveOrCreate().self()
      .should('be.visible');

    return editPage;
  };

  before(() => {
    cy.login();

    cy.getRootE2EResourceName().then((root) => {
      namespace = `${ root }-helm-secret`;
      app = `${ root }-app`;
      secretName = `sh.helm.release.v1.${ app }.v1`;

      cy.createNamespace(namespace);
      cy.createRancherResource('v1', 'secrets', {
        // Steve only maps the kube type to _type when reading, so a write sends it as type
        type:     HELM_RELEASE_TYPE,
        metadata: {
          namespace,
          name:   secretName,
          labels: { ...helmLabels(app), [REMOVED_LABEL]: 'true' }
        },
        data: { release: RELEASE_DATA }
      });

      cy.waitForRancherResource('v1', 'secrets', `${ namespace }/${ secretName }`, (resp: any) => resp.status === 200, 30, { failOnStatusCode: false }).should('eq', true);

      // The UI only gets a secret without its release data, which is what made saving it wipe the data
      cy.getRancherResource('v1', 'secrets', `${ namespace }/${ secretName }`).then((resp: any) => {
        expect(resp.body._type).to.eq(HELM_RELEASE_TYPE);
        expect(resp.body.data?.release).to.eq(undefined);
      });

      cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', `{\"local\":[\"ns://${ namespace }\"]}`);
    });
  });

  it('shows a banner instead of the data on the edit page', () => {
    const editPage = navToEdit();

    editPage.helmReleaseBanner().should('be.visible');
  });

  it('does not offer Edit as YAML on the edit page', () => {
    const editPage = navToEdit();

    editPage.editAsYamlButton().should('not.exist');
  });

  it('does not offer Edit YAML in the list action menu', () => {
    SecretsListPagePo.navTo(localCluster);
    secretsPage.waitForPage();

    const actionMenu = secretsPage.list().resourceTable().sortableTable().rowActionMenuOpen(secretName);

    actionMenu.getMenuItem('Edit Config').should('be.visible');
    actionMenu.getMenuItem('Edit YAML').should('not.exist');

    secretsPage.list().resourceTable().sortableTable().rowActionMenuClose(secretName);
  });

  it('does not offer Edit YAML in the detail page action menu', () => {
    const detailPage = new SecretsCreateEditPo(localCluster, namespace, secretName);

    SecretsListPagePo.navTo(localCluster);
    secretsPage.waitForPage();
    secretsPage.goToDetailsPage(secretName);
    detailPage.waitForPage();
    detailPage.waitForMastheadTitle(secretName);

    const actionMenu = detailPage.openMastheadActionMenu();

    actionMenu.getMenuItem('Edit Config').should('be.visible');
    actionMenu.getMenuItem('Edit YAML').should('not.exist');

    cy.get('body').type('{esc}');
  });

  it('only patches the labels and annotations on save and keeps the release data', () => {
    const expectedLabels = { ...helmLabels(app), [ADDED_LABEL]: 'true' };

    cy.intercept('PATCH', `/v1/secrets/${ namespace }/${ secretName }`).as('saveSecret');

    const editPage = navToEdit();

    editPage.resourceDetail().tabs().clickTabWithName('labels');
    editPage.labels().addKeyValue(ADDED_LABEL, 'true');
    editPage.labels().removeKey(REMOVED_LABEL);
    editPage.labels().waitForUpdate();
    editPage.resourceDetail().cruResource().saveOrCreate().click();

    cy.wait('@saveSecret').then(({ request, response }) => {
      const ops = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

      expect(response?.statusCode).to.eq(200);
      expect(request.headers['content-type']).to.contain('application/json-patch+json');
      expect(ops.map((op: any) => op.path)).to.deep.eq(['/metadata/labels', '/metadata/annotations']);
      expect(ops[0].value).to.deep.eq(expectedLabels);
    });

    getRawSecret(namespace, secretName).then((resp: any) => {
      expect(resp.body.type).to.eq(HELM_RELEASE_TYPE);
      expect(resp.body.data.release).to.eq(RELEASE_DATA);
      expect(resp.body.metadata.labels).to.deep.eq(expectedLabels);
    });
  });

  after(() => {
    cy.tableRowsPerPageAndNamespaceFilter(100, localCluster, 'none', '{"local":["all://user"]}');
    cy.deleteNamespace([namespace]);
  });
});
