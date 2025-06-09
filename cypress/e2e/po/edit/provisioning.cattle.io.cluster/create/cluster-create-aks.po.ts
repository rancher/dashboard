import PagePo from '@/cypress/e2e/po/pages/page.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';
import ClusterManagerCreateRke2AzurePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create-rke2-azure.po';
import AzureCloudCredentialsCreateEditPo from '@/cypress/e2e/po/edit/cloud-credentials-azure.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import eksVersions from '@/pkg/eks/assets/data/eks-versions.js';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';

/**
 * Create page for an AKS cluster
 */
export default class ClusterManagerCreateAKSPagePo extends ClusterManagerCreateRke2AzurePagePo {
  static url(clusterId: string) {
    return `${ ClusterManagerCreatePagePo.url(clusterId) }/create?type=azureaks&rkeType=rke2`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(ClusterManagerCreateRke2AzurePagePo.url(clusterId));
  }

  goToAzureClusterCreation(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return PagePo.goTo(`${ ClusterManagerCreatePagePo.url(clusterId) }?type=azureaks&rkeType=rke2`);
  }

  cloudCredentialsForm(): AzureCloudCredentialsCreateEditPo {
    return new AzureCloudCredentialsCreateEditPo();
  }

  getClusterName() {
    return LabeledInputPo.byLabel(cy.get('.col.span-4'), 'Name');
  }

  getClusterDescription() {
    return new LabeledInputPo('[placeholder*="better describes this resource"]');
  }

  getRegion() {
    return new LabeledSelectPo('[data-testid="cruaks-resourcelocation"]');
  }

  getVersion() {
    return new LabeledSelectPo('[data-testid="cruaks-kubernetesversion"]');
  }

  getNodeGroup() {
    return LabeledInputPo.byLabel(cy.get('.pool'), 'Name');
  }

  getOSdiskType() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'OS Disk Type');
  }

  getVMsize() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'VM Size');
  }

  getAvailabiltyZones() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Availability Zones');
  }

  getOSdiskSize() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'OS Disk Size');
  }

  getNodeCount() {
    return new LabeledInputPo('[data-testid="aks-pool-count-input"]');
  }

  getMaxPods() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Max Pods per Node');
  }

  getMaxSurge() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Max Surge');
  }

  getModeRadioGroup(selector: string) {
    return new RadioGroupInputPo(selector);
  }

  getLinuxAdmin() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Linux Admin Username');
  }

  getClusterResourceGroup() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Cluster Resource Group');
  }

  getNodeResourceGroup() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Node Resource Group');
  }

  getAutoScaling() {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Auto Scaling');
  }

  getLogResourceGroup() {
    return new LabeledInputPo('[data-testid="aks-log-analytics-workspace-group-input"]');
  }

  getLogWorkspaceName() {
    return new LabeledInputPo('[data-testid="aks-log-analytics-workspace-group-input"]');
  }

  getSSHkey() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'SSH Public Key');
  }

  getLoadBalancerSKU() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Load Balancer SKU');
  }

  getInputDNSprefix() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'DNS Prefix');
  }

  getDNSprefix() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'DNS Prefix');
  }

  getNetworkPlugin() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Network Plugin');
  }

  getNetworkPolicy() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Network Policy');
  }

  getVirtualNetwork() {
    return LabeledSelectPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Virtual Network');
  }

  getKubernetesSAR() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Kubernetes Service Address Range');
  }

  getKubernetesDNS() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Kubernetes DNS Service IP Address');
  }

  getDockerBridge() {
    return LabeledInputPo.byLabel(cy.get('[data-testid="cruaks-form"]'), 'Docker Bridge Address');
  }

  getProjNetworkIsolation() {
    return CheckboxInputPo.byLabel(this.self(), 'Project Network Isolation');
  }

  getHTTProuting() {
    return CheckboxInputPo.byLabel(this.self(), 'HTTP Application Routing');
  }

  getEnablePrivateCluster() {
    return CheckboxInputPo.byLabel(this.self(), 'Enable Private Cluster');
  }

  getAuthIPranges() {
    return CheckboxInputPo.byLabel(this.self(), 'Set Authorized IP Ranges');
  }

  getNetorkingRadioGroup() {
    return new RadioGroupInputPo('[.pool .radio-group]');
  }

  getContainerMonitoring() {
    return new CheckboxInputPo('[data-testid="aks-monitoring-checkbox"]');
  }
}
