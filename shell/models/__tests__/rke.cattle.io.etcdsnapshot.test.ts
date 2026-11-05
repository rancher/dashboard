import EtcdSnapshot from '@shell/models/rke.cattle.io.etcdsnapshot';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { SNAPSHOT } from '@shell/config/labels-annotations';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

describe('class EtcdSnapshot', () => {
  const createSnapshot = ({
    cluster = { isDayTwoOpsEnabled: true, metadata: { creationTimestamp: '2026-01-01T00:00:00Z' } } as any,
    status = STATES_ENUM.SUCCESSFUL,
    createdAt = '2026-02-01T00:00:00Z',
  } = {}) => {
    const byId = jest.fn((type: string, id: string) => (type === CAPI.RANCHER_CLUSTER && id === 'fleet-default/c1' ? cluster : undefined));

    return new EtcdSnapshot({
      metadata: {
        name: 's1', namespace: 'fleet-default', labels: { [SNAPSHOT.CLUSTER_NAME]: 'c1' }
      },
      snapshotFile: { status, createdAt },
    }, { rootGetters: { 'management/byId': byId } });
  };

  describe('restoreEnabled', () => {
    it('should be true for a successful snapshot of a cluster with day 2 ops', () => {
      expect(createSnapshot().restoreEnabled).toBe(true);
    });

    it('should be false when the cluster does not have day 2 ops', () => {
      const cluster = { isDayTwoOpsEnabled: false, metadata: { creationTimestamp: '2026-01-01T00:00:00Z' } };

      expect(createSnapshot({ cluster }).restoreEnabled).toBe(false);
    });

    it('should be false when the cluster cannot be found', () => {
      expect(createSnapshot({ cluster: null }).restoreEnabled).toBe(false);
    });

    describe('imported cluster snapshot (in the management cluster namespace)', () => {
      const createImportedSnapshot = (mgmtCluster: any) => {
        const byId = jest.fn((type: string, id: string) => (type === MANAGEMENT.CLUSTER && id === 'c-w246d' ? mgmtCluster : undefined));

        return new EtcdSnapshot({
          metadata: {
            name: 'c-w246d-local-etcd-snapshot', namespace: 'c-w246d', labels: { [SNAPSHOT.CLUSTER_NAME]: 'c-w246d' }
          },
          spec:         { clusterName: 'c-w246d' },
          snapshotFile: { status: STATES_ENUM.SUCCESSFUL, createdAt: '2026-10-15T12:00:02Z' },
        }, { rootGetters: { 'management/byId': byId } });
      };

      it('should be true when the management cluster has day 2 ops', () => {
        expect(createImportedSnapshot({ isDayTwoOpsEnabled: true }).restoreEnabled).toBe(true);
      });

      it('should be false when the management cluster does not have day 2 ops', () => {
        expect(createImportedSnapshot({ isDayTwoOpsEnabled: false }).restoreEnabled).toBe(false);
      });

      it('should be false when the management cluster cannot be found', () => {
        expect(createImportedSnapshot(undefined).restoreEnabled).toBe(false);
      });

      it.each([
        ['older than the management cluster', '2026-10-16T00:00:00Z', true],
        ['newer than the management cluster', '2026-10-01T00:00:00Z', false],
      ])('should check the age of a snapshot %s', (_desc, creationTimestamp, expected) => {
        const snapshot = createImportedSnapshot({ isDayTwoOpsEnabled: true, metadata: { creationTimestamp } });

        expect(snapshot.isSnapshotTooOld).toBe(expected);
        expect(snapshot.restoreEnabled).toBe(!expected);
      });
    });

    it.each([
      STATES_ENUM.FAILED,
      STATES_ENUM.IN_PROGRESS,
    ])('should be false when the snapshot status is %p', (status) => {
      expect(createSnapshot({ status }).restoreEnabled).toBe(false);
    });

    it('should be false when the snapshot is older than the cluster', () => {
      expect(createSnapshot({ createdAt: '2025-12-01T00:00:00Z' }).restoreEnabled).toBe(false);
    });

    it('should only offer the restore action when restore is enabled', () => {
      const cluster = { isDayTwoOpsEnabled: false, metadata: { creationTimestamp: '2026-01-01T00:00:00Z' } };

      expect(createSnapshot({ cluster })._availableActions).toStrictEqual([{
        action: 'promptRestore', enabled: false, icon: 'icon icon-backup-restore', label: 'Restore'
      }]);
    });
  });
});
