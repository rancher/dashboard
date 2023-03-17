import SteveModel from '@shell/plugins/steve/steve-class';
import { _getColorForState, _getReadyMessage, _getStateDisplay } from '@shell/plugins/steve/resourceUtils/resources.cattle.io.backup';

export default class Backup extends SteveModel {
  get readyMessage() {
    return _getReadyMessage;
  }

  get colorForState() {
    return _getColorForState(this);
  }

  get stateDisplay() {
    return _getStateDisplay(this);
  }
}
