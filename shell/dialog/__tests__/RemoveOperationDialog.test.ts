import { mount, flushPromises } from '@vue/test-utils';
import RemoveOperationDialog from '@shell/dialog/RemoveOperationDialog.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import { OPERATION } from '@shell/config/types';

jest.mock('focus-trap', () => ({
  createFocusTrap: jest.fn(() => ({
    activate:   jest.fn(),
    deactivate: jest.fn(),
  })),
}));

// jest.setup.js mocks useI18n (script) to render `<key>-<JSON args>`, and the template's global `t` to render `%<key>%`
const tr = (key: string, args?: object) => `${ key }${ args ? `-${ JSON.stringify(args) }` : '' }`;

const router = { push: jest.fn() };

const op = (type: string, name: string, phase?: string, extra = {}) => ({
  type,
  id:            `fleet-default/${ name }`,
  metadata:      { name, namespace: 'fleet-default' },
  nameDisplay:   name,
  status:        phase ? { phase } : {},
  remove:        jest.fn().mockResolvedValue(undefined),
  currentRoute:  () => ({ name: 'c-cluster-product-resource', params: { cluster: '_' } }),
  currentRouter: () => router,
  ...extra,
});

const createWrapper = (resource: any, props = {}) => mount(RemoveOperationDialog, {
  props: {
    resources: [resource], modal: { show: true, onClose: jest.fn() }, ...props
  },
  global: { provide: { store: {} }, stubs: { teleport: true } },
});

const message = (wrapper: any) => wrapper.find('[data-testid="remove-operation-message"]').text();
const warning = (wrapper: any) => wrapper.find('[data-testid="remove-operation-warning"]');
const confirmButton = (wrapper: any) => wrapper.find('[data-testid="remove-operation-confirm-button"]');
const cancelButton = (wrapper: any) => wrapper.find('[data-testid="remove-operation-cancel-button"]');
const onClose = (wrapper: any) => wrapper.props('modal').onClose;

describe('component: RemoveOperationDialog', () => {
  beforeEach(() => {
    router.push.mockReset();
  });

  it('should render nothing until it is told to show', () => {
    const wrapper = createWrapper(op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Succeeded'), { modal: { show: false, onClose: jest.fn() } });

    expect(wrapper.find('[data-testid="remove-operation-message"]').exists()).toBe(false);
  });

  it('should keep the standard delete prompt title', () => {
    const wrapper = createWrapper(op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Succeeded'));

    expect(wrapper.find('[data-testid="rc-modal-title"]').text()).toBe('%promptRemove.title%');
  });

  it.each([
    [OPERATION.ETCD_SNAPSHOT, 'promptRemoveOperation.kind.etcdSnapshotSave'],
    [OPERATION.ETCD_SNAPSHOT_RESTORE, 'promptRemoveOperation.kind.etcdSnapshotRestore'],
    [OPERATION.ENCRYPTION_KEY_ROTATE, 'promptRemoveOperation.kind.encryptionKeyRotation'],
    [OPERATION.CERTIFICATE_ROTATE, 'promptRemoveOperation.kind.certificateRotation'],
  ])('should name the operation kind for %s', (type, kindKey) => {
    const wrapper = createWrapper(op(type, 'op-1', 'Succeeded'));

    expect(message(wrapper)).toContain(tr('promptRemoveOperation.attemptingToRemove', { kind: kindKey }));
  });

  it('should name the operation being deleted', () => {
    const wrapper = createWrapper(op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Succeeded'));

    expect(wrapper.find('[data-testid="remove-operation-message"] b').text()).toStrictEqual('op-1');
  });

  it.each(['Succeeded', 'Failed', 'Canceled'])('should not warn and should allow delete for a %s operation', (phase) => {
    const wrapper = createWrapper(op(OPERATION.ETCD_SNAPSHOT, 'op-1', phase));

    expect(warning(wrapper).exists()).toBe(false);
    expect(wrapper.findComponent(Checkbox).exists()).toBe(false);
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it.each([['Pending'], ['InProgress'], [undefined]])('should warn and block delete for a %s operation', (phase) => {
    const wrapper = createWrapper(op(OPERATION.ETCD_SNAPSHOT, 'op-1', phase));

    expect(warning(wrapper).text()).toContain('%promptRemoveOperation.inProgress.warning%');
    expect(wrapper.findComponent(Checkbox).props('label')).toBe('%promptRemoveOperation.inProgress.acknowledge%');
    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('should open on the acknowledgement checkbox rather than the focusable warning banner', () => {
    const wrapper = createWrapper(op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'InProgress'));

    expect(wrapper.findComponent(Checkbox).attributes('autofocus')).toBeDefined();
  });

  it('should allow delete once the in progress warning is acknowledged, and block it again if unchecked', async() => {
    const wrapper = createWrapper(op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'InProgress'));
    const checkbox = wrapper.findComponent(Checkbox);

    await checkbox.vm.$emit('update:value', true);

    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();

    await checkbox.vm.$emit('update:value', false);

    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined();
  });

  it('should not delete an in progress operation while unacknowledged', async() => {
    const resource = op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'InProgress');
    const wrapper = createWrapper(resource);

    await confirmButton(wrapper).trigger('click');

    expect(resource.remove).not.toHaveBeenCalled();
  });

  it('should delete the operation and close', async() => {
    const resource = op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Failed');
    const wrapper = createWrapper(resource);

    await confirmButton(wrapper).trigger('click');
    await flushPromises();

    expect(resource.remove).toHaveBeenCalledWith();
    expect(onClose(wrapper)).toHaveBeenCalledWith();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('should leave the detail page of the deleted operation', async() => {
    const resource = op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Succeeded', {
      currentRoute: () => ({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster: '_', product: 'manager', resource: OPERATION.ETCD_SNAPSHOT, namespace: 'fleet-default', id: 'op-1'
        }
      })
    });
    const wrapper = createWrapper(resource);

    await confirmButton(wrapper).trigger('click');
    await flushPromises();

    expect(router.push).toHaveBeenCalledWith({
      name:   'c-cluster-product-resource',
      params: {
        cluster: '_', product: 'manager', resource: OPERATION.ETCD_SNAPSHOT
      }
    });
  });

  it('should show delete errors and stay open', async() => {
    const resource = op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Succeeded', { remove: jest.fn().mockRejectedValue(new Error('forbidden')) });
    const wrapper = createWrapper(resource);

    await confirmButton(wrapper).trigger('click');
    await flushPromises();

    const banners = wrapper.findAllComponents(Banner);

    expect(banners).toHaveLength(1);
    expect(banners[0].props('color')).toBe('error');
    expect(banners[0].text()).toContain('forbidden');
    expect(onClose(wrapper)).not.toHaveBeenCalled();
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('should not close while the delete request is in flight', async() => {
    let finish: (v?: unknown) => void = () => {};
    const resource = op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Succeeded', { remove: jest.fn(() => new Promise((resolve) => (finish = resolve))) });
    const wrapper = createWrapper(resource);

    await confirmButton(wrapper).trigger('click');
    await cancelButton(wrapper).trigger('click');

    expect(cancelButton(wrapper).attributes('disabled')).toBeDefined();
    expect(onClose(wrapper)).not.toHaveBeenCalled();

    finish();
    await flushPromises();

    expect(onClose(wrapper)).toHaveBeenCalledWith();
  });

  it('should close without deleting when cancelled', async() => {
    const resource = op(OPERATION.ETCD_SNAPSHOT, 'op-1', 'Succeeded');
    const wrapper = createWrapper(resource);

    await cancelButton(wrapper).trigger('click');

    expect(onClose(wrapper)).toHaveBeenCalledWith();
    expect(resource.remove).not.toHaveBeenCalled();
  });
});
