import { colorForState, stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class Restore extends SteveModel {
  get canUpdate() {
    return this?.metadata?.state?.error;
  }

  get readyMessage() {
    const conditions = get(this, 'status.conditions');
    const readyMessage = (findBy(conditions, 'type', 'Ready') || {}).message ;

    return readyMessage;
  }

  get colorForState() {
    if (this.readyMessage) {
      return colorForState(this.readyMessage);
    }

    return colorForState();
  }

  get stateDisplay() {
    if (this.readyMessage) {
      return stateDisplay(this.readyMessage);
    }

    return stateDisplay();
  }
}
