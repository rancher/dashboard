
import SteveModel from '@shell/plugins/steve/steve-class';
import { _getNumberTestsSkipped } from '@shell/plugins/steve/resourceUtils/cis.cattle.io.clusterscanprofile';

export default class CISProfile extends SteveModel {
  warnDeletionMessage(toRemove = []) {
    return this.$rootGetters['i18n/t']('cis.deleteProfileWarning', { count: toRemove.length });
  }

  get numberTestsSkipped() {
    return _getNumberTestsSkipped(this);
  }
}
