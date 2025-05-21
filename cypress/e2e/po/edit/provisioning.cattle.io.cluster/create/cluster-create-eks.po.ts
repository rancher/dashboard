import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import ClusterManagerCreateRke2AmazonPagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-amazon.po';
import EKSCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-eks.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import eksVersions from '@/pkg/eks/assets/data/eks-versions.js';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';

/**
 * Create page for an EKS cluster
 */
export default class ClusterManagerCreateEKSPagePo extends ClusterManagerCreateRke2AmazonPagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=amazoneks&rkeType=rke2`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2AmazonPagePo.url(clusterId));
  }

  goToAmazonClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=amazoneks&rkeType=rke2`);
  }

  cloudCredentialsForm(): EKSCloudCredentialsCreateEditPo {
    return new EKSCloudCredentialsCreateEditPo();
  }

  getClusterName() {
    return new LabeledInputPo('[data-testid="eks-name-input"]');
  }

  getClusterDescription() {
    return new LabeledInputPo('[placeholder*="better describes this resource"]');
  }

  getRegion() {
    return new LabeledSelectPo('[data-testid="eks_region"]');
  }

  getVersion() {
    return new LabeledSelectPo('[data-testid="eks-version-dropdown"]');
  }

  getNodeGroup() {
    return new LabeledInputPo('[data-testid="eks-nodegroup-name"]');
  }

  getNodeRole() {
    return new LabeledSelectPo('[data-testid="eks-noderole"]');
  }

  getLauchTemplate() {
    return new LabeledSelectPo('[data-testid="eks-launch-template-dropdown"]');
  }

  getDesiredASGSize() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cru-form"]'), 'Desired ASG Size');
  }

  getMinASGSize() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cru-form"]'), 'Minimum ASG Size');
  }

  getMaxASGSize() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cru-form"]'), 'Maximum ASG Size');
  }

  getInstanceType() {
    return new LabeledSelectPo('[data-testid="eks-instance-type-dropdown"]');
  }

  getDiskSize() {
    return new LabeledInputPo('[data-testid="eks-disksize-input"]');
  }

  getServiceRole() {
    return new RadioGroupInputPo('[data-testid="radio-button-0"]');
  }

  getPublicAccess() {
    return CheckboxInputPo.byLabel(this.self(), 'Public Access');
  }

  getPrivateAccess() {
    return CheckboxInputPo.byLabel(this.self(), 'Private Access');
  }

  getLatestEKSversion() {
    let latestVersion = 0;

    eksVersions.forEach((version: string) => {
      const versionNumber = Number(version);

      if (versionNumber > latestVersion) {
        latestVersion = versionNumber;
      }
    });

    return String(latestVersion);
  }
}
