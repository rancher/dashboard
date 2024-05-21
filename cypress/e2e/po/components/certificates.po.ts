import ComponentPo from '@/cypress/e2e/po/components/component.po';
import BaseResourceList from '~/cypress/e2e/po/lists/base-resource-list.po';

export default class CertificatesPo extends ComponentPo {
  constructor() {
    super('[data-testid="cluster-certs"]');
  }

  expiredBanner() {
    return new ComponentPo('#cluster-certs .banner.error');
  }

  expiringBanner() {
    return new ComponentPo('#cluster-certs .banner.warning');
  }

  list() {
    return new BaseResourceList('[data-testid="sortable-table-list-container"]');
  }
}
