import { shallowMount } from '@vue/test-utils';
import { _EDIT } from '@shell/config/query-params';
import { AUTH_TYPE } from '@shell/config/types';
import RcSelectOrCreateAuthSecret from '@shell/components/form/RcSelectOrCreateAuthSecret.vue';

const mountRcSelectOrCreateAuthSecret = (props = {}) => {
  return shallowMount(RcSelectOrCreateAuthSecret, {
    props: {
      mode:                 _EDIT,
      namespace:            'fleet-default',
      fixedImagePullSecret: true,
      registerBeforeHook:   () => {},
      ...props,
    },
    global: { mocks: { $fetchState: {} } },
  });
};

describe('component: RcSelectOrCreateAuthSecret', () => {
  describe('before save hook', () => {
    it('should register doCreate as a before save hook', () => {
      const registerBeforeHook = jest.fn();
      const wrapper = mountRcSelectOrCreateAuthSecret({ registerBeforeHook });

      expect(registerBeforeHook).toHaveBeenCalledWith((wrapper.vm as any).doCreate, 'registerAuthSecret', 99);
    });

    it('should not register a hook when creation is delegated to the parent', () => {
      const registerBeforeHook = jest.fn();

      mountRcSelectOrCreateAuthSecret({ registerBeforeHook, delegateCreateToParent: true });

      expect(registerBeforeHook).toHaveBeenCalledTimes(0);
    });

    it('should not throw without a hook when creation is delegated to the parent', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => mountRcSelectOrCreateAuthSecret({ registerBeforeHook: undefined, delegateCreateToParent: true })).not.toThrow();
    });

    it('should throw without a hook when it creates the secret itself', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => mountRcSelectOrCreateAuthSecret({ registerBeforeHook: undefined })).toThrow('Before Hook is missing');
    });
  });

  describe('inputauthval when the selection changes', () => {
    it('should emit the newly selected auth type so a parent can restore it after a remount', async() => {
      const wrapper = mountRcSelectOrCreateAuthSecret();

      await wrapper.setData({ selected: AUTH_TYPE._IMAGE_PULL_SECRET });

      const emitted = wrapper.emitted('inputauthval') as any[];

      expect(emitted[emitted.length - 1][0]).toStrictEqual({
        selected: AUTH_TYPE._IMAGE_PULL_SECRET, privateKey: '', publicKey: ''
      });
    });

    it('should emit cleared credentials when switching from a new secret to an existing one', async() => {
      const wrapper = mountRcSelectOrCreateAuthSecret();

      await wrapper.setData({
        selected: AUTH_TYPE._IMAGE_PULL_SECRET, publicKey: 'user', privateKey: 'pass'
      });
      await wrapper.setData({ selected: 'fleet-default/existing' });

      const emitted = wrapper.emitted('inputauthval') as any[];

      expect(emitted[emitted.length - 1][0]).toStrictEqual({
        selected: 'fleet-default/existing', privateKey: '', publicKey: ''
      });
    });
  });
});
