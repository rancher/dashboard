import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';
export default {
  canUpdate() {
    return this?.metadata?.state?.error;
  },
  readyMessage() {
    const conditions = get(this, 'status.conditions');
    const readyMessage = (findBy(conditions, 'type', 'Ready') || {}).message ;

    return readyMessage;
  },
  colorForState() {
    if (this.readyMessage) {
      return colorForState(this.readyMessage);
    }

    return colorForState();
  },

  stateDisplay() {
    if (this.readyMessage) {
      return stateDisplay(this.readyMessage);
    }

    return stateDisplay();
  }

};
