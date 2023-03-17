import SteveModel from '@shell/plugins/steve/steve-class';
import { _getLabelDisplay, _getLink, _getNormalizedGroup } from '@shell/plugins/steve/resourceUtils/ui.cattle.io.navlink';

export default class extends SteveModel {
  get labelDisplay() {
    return _getLabelDisplay(this);
  }

  get link() {
    return _getLink(this, { clusterId: this.$rootGetters['clusterId'] });
  }

  get normalizedGroup() {
    return _getNormalizedGroup(this);
  }

  get actualTarget() {
    return (this.spec.target || '').trim() || '_blank';
  }
}
