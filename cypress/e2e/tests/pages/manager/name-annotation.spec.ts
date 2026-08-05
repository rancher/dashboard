import ClusterManagerCreateRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-custom.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerDetailRke2CustomPagePo from '@/cypress/e2e/po/detail/provisioning.cattle.io.cluster/cluster-detail-rke2-custom.po';
import ClusterManagerEditRke2CustomPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/edit/cluster-edit-rke2-custom.po';
import LabelsAnnotationsPo from '@/cypress/e2e/po/components/labels-annotations.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const MANAGEMENT_CLUSTER_NAME_ANNOTATION = 'provisioning.cattle.io/management-cluster-name';
const OTHER_CATTLE_ANNOTATION = 'some.cattle.io/other-annotation';

const mgmtClusterNameValue = 'custom-mgmt-id';
const otherAnnotationValue = 'some-value';

const namespace = 'fleet-default';
const type = 'provisioning.cattle.io.cluster';

const createClusterTestName = (suffix: string) => `e2e-test-${ +new Date() }-${ suffix }`;

describe('Management Cluster Name Annotation', { testIsolation: 'off' as any, tags: ['@manager', '@adminUser'] }, () => {
  const clusterList = new ClusterManagerListPagePo();
  const createRKE2ClusterPage = new ClusterManagerCreateRke2CustomPagePo();
  const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

  let clusterName: string;
  let removedClusterName: string;

  before(() => {
    cy.login();
    clusterName = createClusterTestName('name-annotation');
    removedClusterName = createClusterTestName('name-annotation-removed');
  });

  after(() => {
    // Clean up: delete both clusters via API
    [clusterName, removedClusterName].forEach((name) => {
      cy.deleteRancherResource('v1', 'provisioning.cattle.io.clusters', `${ namespace }/${ name }`, false);
    });
  });

  it('can set the management-cluster-name annotation during creation without an error icon', () => {
    cy.intercept('POST', `/v1/${ type }s`).as('createRequest');

    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createRKE2ClusterPage.waitForPage();
    createRKE2ClusterPage.selectCustom(0);
    createRKE2ClusterPage.nameNsDescription().name().set(clusterName);

    // Navigate to Labels and Annotations tab
    createRKE2ClusterPage.selectTab(tabbedPo, '[data-testid="btn-labels"]');

    const labelsAnnotations = new LabelsAnnotationsPo('[data-testid="tabbed-block"]');

    // Add the management-cluster-name annotation
    labelsAnnotations.annotations().addRow();
    labelsAnnotations.annotations().setKeyAtIndex(MANAGEMENT_CLUSTER_NAME_ANNOTATION, 0);
    labelsAnnotations.annotations().setValueAtIndex(mgmtClusterNameValue, 0);

    // Verify NO error icon (icon-warning) is shown for the management-cluster-name annotation row
    labelsAnnotations.annotations().keyWarningIcon(0).should('not.exist');

    // Add another cattle.io annotation to prove it IS still protected
    labelsAnnotations.annotations().addRow();
    labelsAnnotations.annotations().setKeyAtIndex(OTHER_CATTLE_ANNOTATION, 1);
    labelsAnnotations.annotations().setValueAtIndex(otherAnnotationValue, 1);

    // Verify the other cattle.io annotation DOES show an error icon
    labelsAnnotations.annotations().keyWarningIcon(1).should('exist');

    // Create the cluster
    createRKE2ClusterPage.create();

    // Verify POST request includes the management-cluster-name annotation but NOT the other cattle.io annotation
    cy.wait('@createRequest', { requestTimeout: LONG_TIMEOUT_OPT.timeout }).then((intercept) => {
      expect(intercept.response?.statusCode, 'Cluster create POST status').to.be.oneOf([200, 201]);

      // Request body should include the management-cluster-name annotation
      expect(intercept.request.body.metadata.annotations).to.have.property(
        MANAGEMENT_CLUSTER_NAME_ANNOTATION, mgmtClusterNameValue
      );

      // Response should also include the annotation
      expect(intercept.response?.body.metadata.annotations).to.have.property(
        MANAGEMENT_CLUSTER_NAME_ANNOTATION, mgmtClusterNameValue
      );
    });
  });

  it('does not include the annotation in the request when it is removed before creation', () => {
    cy.intercept('POST', `/v1/${ type }s`).as('createRemovedRequest');

    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    createRKE2ClusterPage.waitForPage();
    createRKE2ClusterPage.selectCustom(0);
    createRKE2ClusterPage.nameNsDescription().name().set(removedClusterName);

    // Navigate to Labels and Annotations tab
    createRKE2ClusterPage.selectTab(tabbedPo, '[data-testid="btn-labels"]');

    const labelsAnnotations = new LabelsAnnotationsPo('[data-testid="tabbed-block"]');

    // Add the management-cluster-name annotation
    labelsAnnotations.annotations().addRow();
    labelsAnnotations.annotations().setKeyAtIndex(MANAGEMENT_CLUSTER_NAME_ANNOTATION, 0);
    labelsAnnotations.annotations().setValueAtIndex(mgmtClusterNameValue, 0);

    // Remove the annotation row
    labelsAnnotations.annotations().removeButton(0).find('button').click();

    // Create the cluster
    createRKE2ClusterPage.create();

    // Verify the annotation is NOT in the POST request
    cy.wait('@createRemovedRequest', { requestTimeout: LONG_TIMEOUT_OPT.timeout }).then((intercept) => {
      expect(intercept.response?.statusCode, 'Cluster create POST status').to.be.oneOf([200, 201]);

      const annotations = intercept.request.body.metadata?.annotations || {};

      expect(annotations).to.not.have.property(MANAGEMENT_CLUSTER_NAME_ANNOTATION);
    });
  });

  it('shows the annotation as read-only with an error icon when editing the cluster', () => {
    const editClusterPage = new ClusterManagerEditRke2CustomPagePo(undefined, clusterName);

    cy.intercept('PUT', `/v1/${ type }s/${ namespace }/${ clusterName }`).as('updateRequest');

    clusterList.goTo();
    clusterList.waitForPage();
    clusterList.sortableTable().rowElementWithName(clusterName, MEDIUM_TIMEOUT_OPT).should('be.visible').scrollIntoView();
    clusterList.list().actionMenu(clusterName).getMenuItem('Edit Config').click({ force: true });

    editClusterPage.waitForPage('mode=edit', 'basic', LONG_TIMEOUT_OPT);

    // Navigate to Labels and Annotations tab
    editClusterPage.selectTab(tabbedPo, '[data-testid="btn-labels"]');

    const labelsAnnotations = new LabelsAnnotationsPo('[data-testid="tabbed-block"]');

    // The management-cluster-name annotation should have an error/warning icon (read-only indicator)
    labelsAnnotations.annotations().keyInput(0).should('have.value', MANAGEMENT_CLUSTER_NAME_ANNOTATION);
    labelsAnnotations.annotations().keyWarningIcon(0).should('exist');

    // The key and value inputs should be disabled
    labelsAnnotations.annotations().keyInput(0).should('be.disabled');
    labelsAnnotations.annotations().valueInput(0).should('be.disabled');

    // The remove button should be hidden for the read-only row
    labelsAnnotations.annotations().removeButton(0).should('not.exist');

    // Save the cluster
    editClusterPage.save();

    // Verify the PUT request preserves the original annotation value, not the modified one
    cy.wait('@updateRequest', { requestTimeout: LONG_TIMEOUT_OPT.timeout }).then((intercept) => {
      expect(intercept.response?.statusCode, 'Cluster update PUT status').to.be.oneOf([200, 201]);

      // The original annotation value should be preserved
      expect(intercept.request.body.metadata.annotations).to.have.property(
        MANAGEMENT_CLUSTER_NAME_ANNOTATION, mgmtClusterNameValue
      );
    });
  });

  it('displays the annotation in the detail page masthead annotations section', () => {
    const detailPage = new ClusterManagerDetailRke2CustomPagePo(undefined, clusterName);

    detailPage.goTo();
    detailPage.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);

    // The annotations section in the masthead metadata area should contain the annotation
    cy.get('[data-testid="resource-detail-annotations"]').should('contain.text', MANAGEMENT_CLUSTER_NAME_ANNOTATION);
    cy.get('[data-testid="resource-detail-annotations"]').should('contain.text', mgmtClusterNameValue);
  });

  it('shows the management cluster named with the annotation value in related resources', () => {
    const detailPage = new ClusterManagerDetailRke2CustomPagePo(undefined, clusterName);

    detailPage.goTo();
    detailPage.waitForPage(undefined, undefined, LONG_TIMEOUT_OPT);

    // Navigate to the Related Resources tab
    detailPage.selectTab(tabbedPo, '[data-testid="btn-related"]');

    // The management.cattle.io.cluster resource should be named with the annotation value
    cy.get('.tab-container').should('contain.text', mgmtClusterNameValue);
  });
});
