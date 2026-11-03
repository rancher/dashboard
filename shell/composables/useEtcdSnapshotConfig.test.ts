import { nextTick, reactive } from 'vue';
import { useEtcdSnapshotConfig } from '@shell/composables/useEtcdSnapshotConfig';
import type { EtcdSnapshotConfigProps } from '@shell/composables/useEtcdSnapshotConfig';
import { _EDIT, _VIEW } from '@shell/config/query-params';

jest.mock('vuex', () => ({ useStore: () => ({}) }));

const mockI18n = { t: (key: string) => key };

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => mockI18n }));

const INVALID_CRON = '* * * * * *';
const ETCD = {
  disableSnapshots:     false,
  snapshotScheduleCron: '0 */5 * * *',
  snapshotRetention:    5,
  s3:                   null,
};

describe('composable: useEtcdSnapshotConfig', () => {
  const setup = (overrides: Partial<EtcdSnapshotConfigProps> = {}) => {
    const props = reactive<EtcdSnapshotConfigProps>({
      mode: _EDIT, value: { ...ETCD }, s3Backup: false, ...overrides
    });
    const emit = jest.fn();

    return {
      props, emit, ...useEtcdSnapshotConfig(props, emit)
    };
  };
  const validations = (emit: jest.Mock) => emit.mock.calls.filter(([event]) => event === 'validation-changed').map(([, valid]) => valid);

  describe('validation', () => {
    it.each([
      ['an invalid cron schedule', INVALID_CRON, false],
      ['an out of range cron schedule', '60 * * * *', false],
      ['a valid cron schedule', '0 */5 * * *', true],
      ['a predefined schedule', '@daily', true],
      ['an empty cron schedule', '', true],
      ['no cron schedule', undefined, true],
    ])('should report %s (%p) as valid: %p', (_, snapshotScheduleCron, valid) => {
      const { emit } = setup({ value: { ...ETCD, snapshotScheduleCron } });

      expect(validations(emit)).toStrictEqual([valid]);
    });

    it('should report valid when there is no etcd config', () => {
      const { emit } = setup({ value: null });

      expect(validations(emit)).toStrictEqual([true]);
    });

    it('should report an invalid cron schedule as valid when snapshots are disabled', () => {
      const { emit } = setup({
        value: {
          ...ETCD, disableSnapshots: true, snapshotScheduleCron: INVALID_CRON
        }
      });

      expect(validations(emit)).toStrictEqual([true]);
    });

    it.each([
      ['invalid', 'valid', '0 */5 * * *', false],
      ['valid', 'invalid', INVALID_CRON, true],
      ['invalid', 'invalid', INVALID_CRON, false],
    ])('should report invalid when the s3 config is %s and the cron schedule is %s', async(_, __, snapshotScheduleCron, s3Valid) => {
      const { emit, s3ValidationChanged } = setup({
        s3Backup: true,
        value:    {
          ...ETCD, snapshotScheduleCron, s3: { bucket: 'b' }
        }
      });

      s3ValidationChanged(s3Valid);
      await nextTick();

      expect(validations(emit).at(-1)).toBe(false);
    });

    it('should report valid once an invalid cron schedule is fixed', async() => {
      const { props, emit } = setup({ value: { ...ETCD, snapshotScheduleCron: INVALID_CRON } });

      props.value = { ...ETCD, snapshotScheduleCron: '0 1 * * *' };
      await nextTick();

      expect(validations(emit)).toStrictEqual([false, true]);
    });

    it('should report invalid once a valid cron schedule is changed to an invalid one', async() => {
      const { props, emit } = setup();

      props.value = { ...ETCD, snapshotScheduleCron: INVALID_CRON };
      await nextTick();

      expect(validations(emit)).toStrictEqual([true, false]);
    });

    it('should not validate the cron schedule in view mode', () => {
      const { emit, cronScheduleRules } = setup({ mode: _VIEW, value: { ...ETCD, snapshotScheduleCron: INVALID_CRON } });

      expect(cronScheduleRules.value).toStrictEqual([]);
      expect(validations(emit)).toStrictEqual([true]);
    });

    it.each([
      ['cluster.rke2.etcd.snapshotScheduleCron.validationError', INVALID_CRON],
      [undefined, '0 */5 * * *'],
      [undefined, '@daily'],
      [undefined, ''],
      [undefined, undefined],
    ])('should return %p from the cron schedule rule for %p', (message, schedule) => {
      const { cronScheduleRules } = setup();

      expect(cronScheduleRules.value.map((rule) => rule(schedule))).toStrictEqual([message]);
    });
  });

  describe('s3 backups', () => {
    it('should report invalid when s3 backups are turned on, until the s3 config reports valid', async() => {
      const {
        props, emit, s3BackupChanged, s3ValidationChanged
      } = setup();

      s3BackupChanged(true);
      props.s3Backup = true;
      await nextTick();
      s3ValidationChanged(true);
      await nextTick();

      expect(validations(emit)).toStrictEqual([true, false, true]);
    });

    it('should stay valid when s3 backups are enabled again while already enabled', async() => {
      const { emit, s3BackupChanged, s3ValidationChanged } = setup({ s3Backup: true, value: { ...ETCD, s3: { bucket: 'b' } } });

      s3ValidationChanged(true);
      s3BackupChanged(true);
      await nextTick();

      expect(validations(emit)).toStrictEqual([true]);
    });
  });
});
