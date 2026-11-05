import EtcdSnapshotSave from '@shell/models/operation.cattle.io.etcdsnapshotsave';
import EtcdSnapshotRestore from '@shell/models/operation.cattle.io.etcdsnapshotrestore';
import EncryptionKeyRotation from '@shell/models/operation.cattle.io.encryptionkeyrotation';
import CertificateRotation from '@shell/models/operation.cattle.io.certificaterotation';
import DayTwoOperation from '@shell/models/day-two-operation';
import { OPERATION } from '@shell/config/types';

const create = (Model: any, type: string, name: string) => {
  const dispatch = jest.fn();
  const model = new Model({ type, metadata: { name, namespace: 'fleet-default' } }, {
    getters: {}, dispatch, rootGetters: {},
  });

  return { model, dispatch };
};

describe('class: DayTwoOperation', () => {
  it.each([
    [OPERATION.ETCD_SNAPSHOT, EtcdSnapshotSave],
    [OPERATION.ETCD_SNAPSHOT_RESTORE, EtcdSnapshotRestore],
    [OPERATION.ENCRYPTION_KEY_ROTATE, EncryptionKeyRotation],
    [OPERATION.CERTIFICATE_ROTATE, CertificateRotation],
  ])('should give %s the day 2 operation model', (_, Model) => {
    expect(Model.prototype instanceof DayTwoOperation).toBe(true);
  });

  it('should prompt for the delete with the operation dialog', () => {
    const { model, dispatch } = create(EtcdSnapshotSave, OPERATION.ETCD_SNAPSHOT, 'op-1');

    model.promptRemove();

    expect(dispatch).toHaveBeenCalledWith('promptModal', {
      component: 'RemoveOperationDialog',
      ownsModal: true,
      resources: [model],
    });
  });

  // Only the prompt changes: the Delete action (incl. its alt-click straight `remove`) and remove() itself come from the base model
  it('should only override the delete prompt', () => {
    expect(Object.getOwnPropertyNames(DayTwoOperation.prototype)).toStrictEqual(['constructor', 'promptRemove']);
  });
});
