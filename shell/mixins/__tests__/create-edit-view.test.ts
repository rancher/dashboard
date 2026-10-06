import { _EDIT } from '@shell/config/query-params';
import { mount } from '@vue/test-utils';
import CreateEditView from '@shell/mixins/create-edit-view';
import impl from '@shell/mixins/create-edit-view/impl';
import { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';

describe('createEditView should', () => {
  it('add value', () => {
    const Component = {
      render() {},
      mixins: [CreateEditView],
      props:  { value: { id: '123' } }
    };

    // TODO: Investigate type to be used for the .vm property to access the component instance instead of using any
    const instance = mount(Component).vm as any;

    expect(instance.mode).toContain(_EDIT);
  });

  it.each([
    ['_status', { _status: 409 }],
    ['status', { status: 409 }],
  ])('catch conflict error by %p field and retry save()', async(_, error) => {
    const Component = {
      render() {},
      mixins: [CreateEditView],
    };

    const wrapper = mount(Component, {
      props:  { value: { id: '123', type: '' } },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:         () => 'current_store',
              'type-map/isSpoofed': jest.fn().mockImplementation(() => false),
            }
          },
        },
      },
    });

    const instance = (wrapper as any).vm;

    instance.actuallySave = async() => {
      throw error;
    };
    instance.conflict = async() => '';
    instance.done = async() => '';

    const spyConflict = jest.spyOn(wrapper.vm, 'conflict');

    await instance.save(() => '', 'url');

    expect(spyConflict).toHaveBeenCalledTimes(1);
  });

  describe('save', () => {
    const createVm = (isCreate: boolean, afterSaveHook: () => unknown = jest.fn()) => {
      const calls: string[] = [];
      const vm: any = {
        isCreate,
        value:        { notifyGeneratedName: jest.fn(() => calls.push('notify')) },
        actuallySave: jest.fn(() => calls.push('save')),
        applyHooks:   jest.fn(async(hooks: string) => {
          calls.push(hooks);
          if (hooks === AFTER_SAVE_HOOKS) {
            await afterSaveHook();
          }
        }),
        done:   jest.fn(),
        $store: { getters: { 'type-map/isSpoofed': () => false } },
      };

      return { vm, calls };
    };

    it('shows the generated name growl after the after save hooks when creating', async() => {
      const { vm, calls } = createVm(true);
      const buttonDone = jest.fn();

      await (impl.methods as any).save.call(vm, buttonDone);

      expect(calls).toStrictEqual([BEFORE_SAVE_HOOKS, 'save', AFTER_SAVE_HOOKS, 'notify']);
      expect(buttonDone).toHaveBeenCalledWith(true);
    });

    it('does not show the generated name growl when editing', async() => {
      const { vm } = createVm(false);

      await (impl.methods as any).save.call(vm, jest.fn());

      expect(vm.value.notifyGeneratedName).toHaveBeenCalledTimes(0);
    });

    it('does not show the generated name growl when an after save hook fails', async() => {
      const { vm } = createVm(true, () => Promise.reject(new Error('hook failed')));
      const buttonDone = jest.fn();

      jest.spyOn(console, 'error').mockImplementation(() => {});

      await (impl.methods as any).save.call(vm, buttonDone);

      expect(vm.value.notifyGeneratedName).toHaveBeenCalledTimes(0);
      expect(buttonDone).toHaveBeenCalledWith(false);
    });
  });
});
