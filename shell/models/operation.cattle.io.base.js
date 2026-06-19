import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES, mapStateToEnum } from '@shell/plugins/dashboard-store/resource-class';

const TRANSITIONING_PHASES = ['Pending', 'InProgress'];

export default class OperationBase extends SteveModel {
  get phase() {
    return this.status?.phase || 'Pending';
  }

  get stateDisplay() {
    return this.phase;
  }

  get stateBackground() {
    const state = mapStateToEnum(this.phase);

    return STATES[state]?.color || 'info';
  }

  get stateObj() {
    const phase = this.phase;
    const state = mapStateToEnum(phase) || 'unknown';

    return {
      name:          state,
      transitioning: TRANSITIONING_PHASES.includes(phase),
      error:         phase === 'Failed',
      message:       this.status?.message,
    };
  }

  get clusterRef() {
    return this.spec?.clusterRef;
  }

  get nameDisplay() {
    return this.metadata?.name || this.id;
  }
}
