
import SteveModel from '@/plugins/steve/steve-class';

export default class extends SteveModel {
  warnDeletionMessage(toRemove = []) {
    return this.$rootGetters['i18n/t']('cis.deleteProfileWarning', { count: toRemove.length });
  }

  get numberTestsSkipped() {
    const { skipTests = [] } = this.spec;

    return skipTests.length;
  }
}
