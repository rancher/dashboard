import PagePo from '@/cypress/e2e/po/pages/page.po';
import ResourceDetailPo from '@/cypress/e2e/po/edit/resource-detail.po';

/**
 * Shared detail-page behavior
 */
export abstract class BaseDetailPagePo extends PagePo {
/**
 * Returns resource detail page object
 * @returns
 */
  resourceDetail() {
    return new ResourceDetailPo(this.self());
  }
}
