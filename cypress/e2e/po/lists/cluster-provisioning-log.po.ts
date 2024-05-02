import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class ClusterProvisioningLogPo extends BaseResourceList {
  logsContainer() {
    return this.self().find('.logs-container');
  }
}
