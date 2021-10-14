import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';
import SteveModel from '@/plugins/steve/steve-class';

export default class Backup extends SteveModel {
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
