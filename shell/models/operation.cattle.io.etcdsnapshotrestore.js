import OperationBase from '@shell/models/operation.cattle.io.base';

export default class EtcdSnapshotRestoreOperation extends OperationBase {
  get snapshotRef() {
    return this.spec?.snapshotRef;
  }
}
