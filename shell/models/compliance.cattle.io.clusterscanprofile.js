
import SteveModel from '@shell/plugins/steve/steve-class';
import { NAME as PRODUCT_NAME } from '@shell/config/product/compliance';
import { COMPLIANCE } from '@shell/config/types';

export default class ComplianceProfile extends SteveModel {
  warnDeletionMessage(toRemove = []) {
    return this.$rootGetters['i18n/t']('compliance.deleteProfileWarning', { count: toRemove.length });
  }

  get numberTestsSkipped() {
    const { skipTests = [] } = this.spec;

    return skipTests?.length || 0;
  }

  get benchmarkVersionLink() {
    if (this.spec?.benchmarkVersion) {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          resource: COMPLIANCE.BENCHMARK,
          product:  PRODUCT_NAME,
          id:       this.spec?.benchmarkVersion
        }
      };
    }

    return {};
  }
}
