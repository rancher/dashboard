import { mount, VueWrapper } from '@vue/test-utils';
import GenericPrompt from '@shell/dialog/GenericPrompt.vue';
import AsyncButton from '@shell/components/AsyncButton';

const t = (key: string): string => key;

describe('component: GenericPrompt', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = (propsData: Record<string, any> = {}) => {
    return mount(GenericPrompt, {
      propsData,
      global: {
        mocks: {
          t,
          // AsyncButton (Options API) reads this.$store.getters directly
          $store: {
            getters: { 'i18n/t': t, 'i18n/exists': jest.fn() }, dispatch: jest.fn(), commit: jest.fn()
          },
        },
      },
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('backward compatibility (no secondary action)', () => {
    it('should render only one AsyncButton by default', () => {
      wrapper = mountComponent({ applyAction: jest.fn().mockResolvedValue(undefined) });

      expect(wrapper.findAllComponents(AsyncButton)).toHaveLength(1);
    });

    it('should still apply/close/confirm via the primary action as before', async() => {
      const applyAction = jest.fn().mockResolvedValue(undefined);
      const confirm = jest.fn();

      wrapper = mountComponent({ applyAction, confirm });

      const buttonDone = jest.fn();

      await wrapper.vm.apply(buttonDone);

      expect(applyAction).toHaveBeenCalledWith(buttonDone);
      expect(confirm).toHaveBeenCalledWith(true);
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('secondary action', () => {
    it('should render a second AsyncButton when secondaryApplyAction is provided', () => {
      wrapper = mountComponent({
        applyAction:          jest.fn(),
        secondaryApplyAction: jest.fn(),
      });

      expect(wrapper.findAllComponents(AsyncButton)).toHaveLength(2);
    });

    it('should call secondaryApplyAction, confirm, and emit close on success', async() => {
      const secondaryApplyAction = jest.fn().mockResolvedValue(undefined);
      const confirm = jest.fn();

      wrapper = mountComponent({
        applyAction: jest.fn(),
        secondaryApplyAction,
        confirm,
      });

      const buttonDone = jest.fn();

      await wrapper.vm.applySecondary(buttonDone);

      expect(secondaryApplyAction).toHaveBeenCalledWith(buttonDone);
      expect(confirm).toHaveBeenCalledWith(true);
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should surface errors and call buttonDone(false) when secondaryApplyAction rejects', async() => {
      const secondaryApplyAction = jest.fn().mockRejectedValue(new Error('nope'));

      wrapper = mountComponent({
        applyAction: jest.fn(),
        secondaryApplyAction,
      });

      const buttonDone = jest.fn();

      await wrapper.vm.applySecondary(buttonDone);

      expect(buttonDone).toHaveBeenCalledWith(false);
      expect(wrapper.emitted('close')).toBeFalsy();
    });
  });
});
