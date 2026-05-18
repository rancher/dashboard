import { ConfigMapCreateEditPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';

const localCluster = 'local';
const namespace = 'default';
const shortName = `a`;
const longName = `e2e-test-long-configmap-name-that-should-truncate-with-ellipsis`;

describe('ConfigMap Detail Title Bar', { testIsolation: false, tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    cy.createConfigMap(namespace, shortName);
    cy.createConfigMap(namespace, longName);
  });

  it('should keep the state badge adjacent to a short resource name', () => {
    const detailPage = new ConfigMapCreateEditPagePo(localCluster, namespace, shortName);

    detailPage.goTo();
    detailPage.waitForPage();

    cy.get('.title-bar h1.title .resource-name').then(($name) => {
      cy.get('.title-bar h1.title .badge-state').then(($badge) => {
        const nameRect = $name[0].getBoundingClientRect();
        const badgeRect = $badge[0].getBoundingClientRect();
        const gap = badgeRect.left - nameRect.right;

        expect(gap).to.be.lessThan(20);
      });
    });
  });

  it('should keep the state badge adjacent to a long resource name', () => {
    const detailPage = new ConfigMapCreateEditPagePo(localCluster, namespace, longName);

    detailPage.goTo();
    detailPage.waitForPage();

    cy.get('.title-bar h1.title .resource-name').then(($name) => {
      cy.get('.title-bar h1.title .badge-state').then(($badge) => {
        const nameRect = $name[0].getBoundingClientRect();
        const badgeRect = $badge[0].getBoundingClientRect();
        const gap = badgeRect.left - nameRect.right;

        expect(gap).to.be.lessThan(20);
      });
    });
  });

  after('clean up', () => {
    cy.deleteRancherResource('v1', 'configmaps', `${ namespace }/${ shortName }`);
    cy.deleteRancherResource('v1', 'configmaps', `${ namespace }/${ longName }`);
  });
});
