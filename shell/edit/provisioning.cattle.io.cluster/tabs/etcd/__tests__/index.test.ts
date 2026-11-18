import { shallowMount } from '@vue/test-utils';
import Etcd from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/index.vue';
import { _EDIT } from '@shell/config/query-params';

// shared.ts (imported by S3Config) requires provider images, which aren't available to jest
jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({ RETENTION_DEFAULT: 5 }));

const ETCD = {
  disableSnapshots: false, snapshotScheduleCron: '0 */5 * * *', snapshotRetention: 5, s3: null
};

describe('component: provisioning etcd tab', () => {
  const registerBeforeHook = jest.fn();

  const createWrapper = (props: Record<string, unknown> = {}) => {
    const value = {
      metadata: { namespace: 'fleet-default' },
      spec:     { rkeConfig: { etcd: { ...ETCD }, machineGlobalConfig: {} } },
    };

    return shallowMount(Etcd, {
      props: {
        mode:            _EDIT,
        value,
        selectedVersion: {},
        registerBeforeHook,
        ...props,
      },
      global: { mocks: { t: (key: string) => key } },
    });
  };

  const etcdForm = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findComponent({ name: 'EtcdSnapshotConfig' });

  it('should pass spec.rkeConfig.etcd and the cluster namespace to the shared etcd snapshot form', () => {
    const wrapper = createWrapper({ s3Backup: true });
    const form = etcdForm(wrapper);

    expect(form.props('value')).toStrictEqual(ETCD);
    expect(form.props('namespace')).toBe('fleet-default');
    expect(form.props('s3Backup')).toBe(true);
    expect(form.props('mode')).toBe(_EDIT);
    expect(form.props('registerBeforeHook')).toBe(registerBeforeHook);
  });

  it('should write updates from the form to spec.rkeConfig.etcd', () => {
    const wrapper = createWrapper();
    const neu = { ...ETCD, snapshotRetention: 9 };

    etcdForm(wrapper).vm.$emit('update:value', neu);

    expect((wrapper.props('value') as any).spec.rkeConfig.etcd).toStrictEqual(neu);
  });

  it('should re-emit s3 backup and validation changes with the events rke2.vue listens to', () => {
    const wrapper = createWrapper();

    etcdForm(wrapper).vm.$emit('s3-backup-changed', true);
    etcdForm(wrapper).vm.$emit('validation-changed', false);

    expect(wrapper.emitted('s3-backup-changed')).toStrictEqual([[true]]);
    expect(wrapper.emitted('etcd-validation-changed')).toStrictEqual([[false]]);
  });

  it.each([
    [{ serverArgs: { 'etcd-expose-metrics': {} } }, true],
    [{ serverArgs: {} }, false],
  ])('should only show the expose metrics option when the selected version supports it (%p)', (selectedVersion, visible) => {
    const wrapper = createWrapper({ selectedVersion });
    const metrics = wrapper.findAllComponents({ name: 'RadioGroup' }).filter((c) => c.props('name') === 'etcd-expose-metrics');

    expect(metrics).toHaveLength(visible ? 1 : 0);
  });
});
