import { shallowMount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import RcEtcdSnapshotConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/RcEtcdSnapshotConfig.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import { SECTION_TYPE } from '@components/RcSection';

// shared.ts (imported by RcS3Config) requires provider images, which aren't available to jest
jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({ RETENTION_DEFAULT: 5 }));

// RcSection's default shallow-mount stub doesn't render its default slot, which would hide the content under test
const RcSectionStub = {
  name:  'RcSection',
  props: {
    title: String, type: String, mode: String, expandable: Boolean, expanded: Boolean
  },
  template: '<div><slot /></div>',
};

const ETCD = {
  disableSnapshots:     false,
  snapshotScheduleCron: '0 */5 * * *',
  snapshotRetention:    5,
  s3:                   null,
};

describe('component: RcEtcdSnapshotConfig', () => {
  const registerBeforeHook = jest.fn();

  const createWrapper = (props: Record<string, unknown> = {}) => {
    const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

    return shallowMount(RcEtcdSnapshotConfig, {
      props: {
        mode:      _EDIT,
        value:     { ...ETCD },
        namespace: 'fleet-default',
        registerBeforeHook,
        ...props,
      },
      global: {
        plugins: [store],
        stubs:   { RcSection: RcSectionStub },
        mocks:   { t: (key: string) => key },
      }
    });
  };

  const radioGroup = (wrapper: VueWrapper<any>, testId: string) => wrapper.findAllComponents({ name: 'RadioGroup' }).find((c) => c.attributes('data-testid') === testId);
  const byTestId = (wrapper: VueWrapper<any>, testId: string) => wrapper.find(`[data-testid="${ testId }"]`);
  const lastUpdate = (wrapper: VueWrapper<any>) => {
    const events = wrapper.emitted('update:value') || [];

    return events[events.length - 1]?.[0];
  };

  describe('rendering', () => {
    it('should show the current values', () => {
      const wrapper = createWrapper();

      expect(radioGroup(wrapper, 'etcd-disable-snapshots')?.props('value')).toBe(false);
      expect(byTestId(wrapper, 'etcd-snapshot-schedule-cron').attributes('value')).toBe('0 */5 * * *');
      expect(byTestId(wrapper, 'etcd-snapshot-retention').attributes('value')).toBe('5');
      expect(radioGroup(wrapper, 'etcd-s3-backup')?.props('value')).toBe(false);
    });

    it.each([
      [null],
      [undefined],
      [{}],
    ])('should treat an empty etcd config (%p) as snapshots enabled', (value) => {
      const wrapper = createWrapper({ value });

      expect(radioGroup(wrapper, 'etcd-disable-snapshots')?.props('value')).toBe(false);
      expect(byTestId(wrapper, 'etcd-snapshot-schedule-cron').exists()).toBe(true);
      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('should hide the schedule, retention and s3 options when snapshots are disabled', () => {
      const wrapper = createWrapper({ value: { ...ETCD, disableSnapshots: true } });

      expect(radioGroup(wrapper, 'etcd-disable-snapshots')?.props('value')).toBe(true);
      expect(byTestId(wrapper, 'etcd-snapshot-schedule-cron').exists()).toBe(false);
      expect(byTestId(wrapper, 'etcd-snapshot-retention').exists()).toBe(false);
      expect(radioGroup(wrapper, 'etcd-s3-backup')).toBeUndefined();
    });

    it.each([
      [true, true],
      [false, false],
    ])('should show the S3 config when s3Backup is %p', (s3Backup, visible) => {
      const wrapper = createWrapper({ s3Backup, value: { ...ETCD, s3: { bucket: 'b' } } });

      expect(wrapper.findComponent({ name: 'RcS3Config' }).exists()).toBe(visible);
    });

    it('should pass the s3 config, local retention, namespace and before hook to RcS3Config', () => {
      const s3 = { bucket: 'my-bucket', retention: 3 };
      const wrapper = createWrapper({ s3Backup: true, value: { ...ETCD, s3 } });
      const s3Config = wrapper.findComponent({ name: 'RcS3Config' });

      expect(s3Config.props('value')).toStrictEqual(s3);
      expect(s3Config.props('localRetentionCount')).toBe(5);
      expect(s3Config.props('namespace')).toBe('fleet-default');
      expect(s3Config.props('registerBeforeHook')).toBe(registerBeforeHook);
    });

    it('should pass the mode to the inputs', () => {
      const wrapper = createWrapper({ mode: _VIEW });

      expect(radioGroup(wrapper, 'etcd-disable-snapshots')?.props('mode')).toBe(_VIEW);
      expect(radioGroup(wrapper, 'etcd-s3-backup')?.props('mode')).toBe(_VIEW);
    });
  });

  describe('updates', () => {
    it('should emit a new etcd object when the cron schedule changes, without mutating value', () => {
      const value = { ...ETCD };
      const wrapper = createWrapper({ value });

      wrapper.findComponent(LabeledInput).vm.$emit('update:value', '0 1 * * *');

      expect(lastUpdate(wrapper)).toStrictEqual({ ...ETCD, snapshotScheduleCron: '0 1 * * *' });
      expect(value).toStrictEqual(ETCD);
    });

    it('should emit a new etcd object when the retention changes', () => {
      const wrapper = createWrapper();

      wrapper.findComponent({ name: 'UnitInput' }).vm.$emit('update:value', 9);

      expect(lastUpdate(wrapper)).toStrictEqual({ ...ETCD, snapshotRetention: 9 });
    });

    it('should only emit the changed field when there was no etcd config', () => {
      const wrapper = createWrapper({ value: null });

      wrapper.findComponent({ name: 'UnitInput' }).vm.$emit('update:value', 3);

      expect(lastUpdate(wrapper)).toStrictEqual({ snapshotRetention: 3 });
    });

    it('should clear s3, disable s3 backups and report valid when snapshots are disabled', () => {
      const wrapper = createWrapper({ s3Backup: true, value: { ...ETCD, s3: { bucket: 'b' } } });

      radioGroup(wrapper, 'etcd-disable-snapshots')?.vm.$emit('update:value', true);

      expect(lastUpdate(wrapper)).toStrictEqual({
        ...ETCD, disableSnapshots: true, s3: null
      });
      expect(wrapper.emitted('s3-backup-changed')).toStrictEqual([[false]]);
      expect(wrapper.emitted('validation-changed')).toStrictEqual([[true]]);
    });

    it('should keep s3 and not touch s3 backups when snapshots are enabled', () => {
      const s3 = { bucket: 'b' };
      const wrapper = createWrapper({
        value: {
          ...ETCD, disableSnapshots: true, s3
        }
      });

      radioGroup(wrapper, 'etcd-disable-snapshots')?.vm.$emit('update:value', false);

      expect(lastUpdate(wrapper)).toStrictEqual({
        ...ETCD, disableSnapshots: false, s3
      });
      expect(wrapper.emitted('s3-backup-changed')).toBeUndefined();
    });

    it.each([
      ['no s3 config', null, {}],
      ['an empty s3 config', {}, {}],
      ['an existing s3 config', { bucket: 'existing' }, { bucket: 'existing' }],
    ])('should initialise s3 when enabling s3 backups with %s', (_, s3, expected) => {
      const wrapper = createWrapper({ value: { ...ETCD, s3 } });

      radioGroup(wrapper, 'etcd-s3-backup')?.vm.$emit('update:value', true);

      expect(lastUpdate(wrapper)).toStrictEqual({ ...ETCD, s3: expected });
      expect(wrapper.emitted('s3-backup-changed')).toStrictEqual([[true]]);
      // the s3 form needs a bucket, so it starts invalid
      expect(wrapper.emitted('validation-changed')).toStrictEqual([[false]]);
    });

    it('should clear s3 and report valid when disabling s3 backups', () => {
      const wrapper = createWrapper({ s3Backup: true, value: { ...ETCD, s3: { bucket: 'b' } } });

      radioGroup(wrapper, 'etcd-s3-backup')?.vm.$emit('update:value', false);

      expect(lastUpdate(wrapper)).toStrictEqual({ ...ETCD, s3: null });
      expect(wrapper.emitted('s3-backup-changed')).toStrictEqual([[false]]);
      expect(wrapper.emitted('validation-changed')).toStrictEqual([[true]]);
    });

    it('should emit the s3 config and its validation from RcS3Config', () => {
      const wrapper = createWrapper({ s3Backup: true, value: { ...ETCD, s3: {} } });
      const s3Config = wrapper.findComponent({ name: 'RcS3Config' });

      s3Config.vm.$emit('update:value', { bucket: 'new' });
      s3Config.vm.$emit('validationChanged', true);

      expect(lastUpdate(wrapper)).toStrictEqual({ ...ETCD, s3: { bucket: 'new' } });
      expect(wrapper.emitted('validation-changed')).toStrictEqual([[true]]);
    });
  });

  describe('sections', () => {
    const section = (wrapper: VueWrapper<any>, testId: string) => wrapper.findAllComponents(RcSectionStub).find((c) => c.attributes('data-testid') === testId);

    it('should render Automatic Backups as a secondary section', () => {
      const wrapper = createWrapper();
      const automaticBackups = section(wrapper, 'etcd-automatic-backups');

      expect(automaticBackups?.props('title')).toBe('cluster.rke2.etcd.disableSnapshots.label');
      expect(automaticBackups?.props('type')).toBe(SECTION_TYPE.SECONDARY);
      expect(automaticBackups?.props('mode')).toBe('with-header');
      expect(automaticBackups?.props('expandable')).toBe(true);
    });

    it('should render Save Backups to S3 as a secondary section inside Automatic Backups', () => {
      const wrapper = createWrapper();
      const s3Backups = section(wrapper, 'etcd-automatic-backups')?.findAllComponents(RcSectionStub).find((c) => c.attributes('data-testid') === 'etcd-s3-backups');

      expect(s3Backups?.props('title')).toBe('cluster.rke2.etcd.s3backups.label');
      expect(s3Backups?.props('type')).toBe(SECTION_TYPE.SECONDARY);
      expect(s3Backups?.findAllComponents({ name: 'RadioGroup' }).find((c) => c.attributes('data-testid') === 'etcd-s3-backup')?.exists()).toBe(true);
    });

    it('should use the section titles instead of the radio group labels', () => {
      const wrapper = createWrapper();

      expect(radioGroup(wrapper, 'etcd-disable-snapshots')?.props('label')).toBeNull();
      expect(radioGroup(wrapper, 'etcd-s3-backup')?.props('label')).toBeNull();
    });

    it.each([
      ['0 */5 * * *', true],
      ['', false],
      [undefined, false],
    ])('should make room for the cron description when the schedule is %p: %p', (snapshotScheduleCron, hasHint) => {
      const wrapper = createWrapper({ value: { ...ETCD, snapshotScheduleCron } });
      const row = byTestId(wrapper, 'etcd-snapshot-schedule-cron').element.closest('.row');

      expect(row?.classList.contains('has-cron-hint')).toBe(hasHint);
    });

    it('should hide the Save Backups to S3 section when automatic backups are disabled', () => {
      const wrapper = createWrapper({ value: { ...ETCD, disableSnapshots: true } });

      expect(section(wrapper, 'etcd-automatic-backups')?.exists()).toBe(true);
      expect(section(wrapper, 'etcd-s3-backups')).toBeUndefined();
    });
  });

  describe('unset schedule and retention', () => {
    it.each([
      ['empty', {
        ...ETCD, snapshotScheduleCron: '', snapshotRetention: 0
      }],
      ['missing', {}],
    ])('should show them %s, with the RKE2/K3s defaults as placeholders', (_, value) => {
      const wrapper = createWrapper({ value, s3Backup: true });
      const cron = wrapper.findComponent(LabeledInput);
      const retention = wrapper.findComponent({ name: 'UnitInput' });

      expect(cron.props('value')).toBeFalsy();
      expect(cron.props('placeholder')).toBe('0 */12 * * *');
      expect(retention.props('value')).toBeNull();
      expect(retention.props('placeholder')).toBe(5);
      // so S3 'same as local' retention falls back to the default too
      expect(wrapper.findComponent({ name: 'RcS3Config' }).props('localRetentionCount')).toBeNull();
    });

    it('should show a set retention', () => {
      const wrapper = createWrapper({ value: { ...ETCD, snapshotRetention: 3 } });

      expect(wrapper.findComponent({ name: 'UnitInput' }).props('value')).toBe(3);
    });

    it('should not change the etcd config until it is edited', () => {
      const wrapper = createWrapper({
        value: {
          ...ETCD, snapshotScheduleCron: '', snapshotRetention: 0
        }
      });

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });
  });
});
