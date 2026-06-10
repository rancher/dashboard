import BaseResourceList from '@/cypress/e2e/po/lists/base-resource-list.po';

export default class FleetClustersListPo extends BaseResourceList {
  // Specific method: filters the sub-rows that correspond to fleet cluster
  fleetClusterRows() {
    return this.self().find('tbody tr.labels-row');
  }
}
