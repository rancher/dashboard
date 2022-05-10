
import SteveModel from '@shell/plugins/steve/steve-class';

export default class CISProfile extends SteveModel {
  warnDeletionMessage(toRemove = []) {
    return this.$rootGetters['i18n/t']('cis.deleteProfileWarning', { count: toRemove.length });
  }

  get numberTestsSkipped() {
    const { skipTests = [] } = this.spec;

    return skipTests.length;
  }
}
