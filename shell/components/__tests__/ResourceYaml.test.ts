import ResourceYaml from '@shell/components/ResourceYaml.vue';
import { AFTER_SAVE_HOOKS, BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';

describe('component: ResourceYaml', () => {
  describe('method: save', () => {
    const createVm = (isCreate: boolean, afterSaveHook: () => unknown = jest.fn()) => {
      const calls: string[] = [];
      const vm: any = {
        isCreate,
        currentYaml: 'metadata:\n  generateName: test-\n',
        initialYaml: '',
        value:       {
          yamlForSave:         jest.fn(() => null),
          saveYaml:            jest.fn(() => calls.push('save')),
          notifyGeneratedName: jest.fn(() => calls.push('notify')),
        },
        applyHooks: jest.fn(async(hooks: string) => {
          calls.push(hooks);
          if (hooks === AFTER_SAVE_HOOKS) {
            await afterSaveHook();
          }
        }),
        done:  jest.fn(),
        $emit: jest.fn(),
      };

      return { vm, calls };
    };

    it('shows the generated name growl after the after save hooks when creating', async() => {
      const { vm, calls } = createVm(true);
      const buttonDone = jest.fn();

      await (ResourceYaml.methods as any).save.call(vm, buttonDone);

      expect(calls).toStrictEqual([BEFORE_SAVE_HOOKS, 'save', AFTER_SAVE_HOOKS, 'notify']);
      expect(buttonDone).toHaveBeenCalledWith(true);
    });

    it('does not show the generated name growl when editing', async() => {
      const { vm } = createVm(false);

      await (ResourceYaml.methods as any).save.call(vm, jest.fn());

      expect(vm.value.notifyGeneratedName).toHaveBeenCalledTimes(0);
    });

    it('does not show the generated name growl when an after save hook fails', async() => {
      const { vm } = createVm(true, () => Promise.reject(new Error('hook failed')));
      const buttonDone = jest.fn();

      await (ResourceYaml.methods as any).save.call(vm, buttonDone);

      expect(vm.value.notifyGeneratedName).toHaveBeenCalledTimes(0);
      expect(buttonDone).toHaveBeenCalledWith(false);
    });
  });
});
