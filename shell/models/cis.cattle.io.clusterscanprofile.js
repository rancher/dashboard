
import SteveModel from '@shell/plugins/steve/steve-class';
import { NAME as PRODUCT_NAME } from '@shell/config/product/cis';
import { CIS } from '@shell/config/types';

export default class CISProfile extends SteveModel {
  warnDeletionMessage(toRemove = []) {
    return this.$rootGetters['i18n/t']('cis.deleteProfileWarning', { count: toRemove.length });
  }

  get numberTestsSkipped() {
    const { skipTests = [] } = this.spec;

    return skipTests.length;
  }

  get benchmarkVersionLink() {
    if (this.spec?.benchmarkVersion) {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          resource: CIS.BENCHMARK,
          product:  PRODUCT_NAME,
          id:       this.spec?.benchmarkVersion
        }
      };
    }

    return {};
  }
}
