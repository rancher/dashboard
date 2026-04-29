import SteveModel from '@shell/plugins/steve/steve-class';

const PHASE_STATE_MAP = {
  Pending:    'info',
  InProgress: 'info',
  Succeeded:  'success',
  Failed:     'error',
  Cancelled:  'warning',
};

export default class EncryptionKeyRotateOperation extends SteveModel {
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
