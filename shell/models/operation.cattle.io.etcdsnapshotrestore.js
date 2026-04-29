import SteveModel from '@shell/plugins/steve/steve-class';
import { PHASE_STATE_MAP } from '@shell/models/operation.cattle.io.constants';

export default class EtcdSnapshotRestoreOperation extends SteveModel {
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

  get snapshotRef() {
    return this.spec?.snapshotRef;
  }

  get restoreMode() {
    return this.spec?.restoreRKEConfig;
  }

  get nameDisplay() {
    return this.metadata?.name || this.id;
  }
}
