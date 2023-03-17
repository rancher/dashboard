
import SteveModel from '@shell/plugins/steve/steve-class';
import { _getColorForState, _getReadyMessage, _getStateDisplay } from '@shell/plugins/steve/resourceUtils/resources.cattle.io.restore';

export default class Restore extends SteveModel {
  get canUpdate() {
    return this?.metadata?.state?.error;
  }

  get readyMessage() {
    return _getReadyMessage(this);
  }

  get colorForState() {
    return _getColorForState(this);
  }

  get stateDisplay() {
    return _getStateDisplay(this);
  }
}
