import SteveModel from '@shell/plugins/steve/steve-class';
import { PHASE_STATE_MAP } from '@shell/models/operation.cattle.io.constants';

export default class CertRotateOperation extends SteveModel {
  get phase() {
    return this.status?.phase || 'Pending';
  }

  get stateDisplay() {
    return this.phase;
  }

  get stateBackground() {
    return PHASE_STATE_MAP[this.phase] || 'info';
  }

  get stateDescription() {
    return this.status?.message || '';
  }

  get clusterRef() {
    return this.spec?.clusterRef;
  }

  get nameDisplay() {
    return this.metadata?.name || this.id;
  }
}
