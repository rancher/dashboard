import { shallowMount } from '@vue/test-utils';
import { createStore, Store } from 'vuex';
import RcPrivateRegistry from '@shell/components/form/RcPrivateRegistry.vue';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import RcSelectOrCreateAuthSecret from '@shell/components/form/RcSelectOrCreateAuthSecret.vue';
import { AUTH_TYPE } from '@shell/config/types';

const buildStore = (): Store<any> => {
  return createStore({
    getters: {
      'i18n/t':          () => (text: string) => text,
      t:                 () => (text: string) => text,
      'management/byId': () => () => null,
    },
  });
};

const mountRcPrivateRegistry = (props = {}) => {
  const store = buildStore();

  return shallowMount(RcPrivateRegistry, {
    props: {
      mode:               'edit',
      registerBeforeHook: jest.fn(),
      ...props
    },
    global: {
      plugins: [store],
      mocks:   { $store: store },
      stubs:   { RcContentGroup: { template: '<div><slot /></div>' } }
    }
  });
};

describe('rcPrivateRegistry', () => {
  describe('initial state when (re)mounted', () => {
    it.each([
      [false, undefined, false],
      [true, undefined, true],
      [false, 'registry.example.com', true],
      [true, 'registry.example.com', true],
    ])('given enabled %p and value %p, should show the checkbox as %p', (enabled, value, expected) => {
      const wrapper = mountRcPrivateRegistry({ enabled, value });

      expect(wrapper.findComponent(Checkbox).props('value')).toBe(expected);
    });

    it('should show the URL input when enabled but no URL has been entered yet', () => {
      const wrapper = mountRcPrivateRegistry({ enabled: true });

      expect(wrapper.findComponent(LabeledInput).exists()).toBe(true);
    });

    it('should not emit update:enabled when mounted as enabled with no URL', () => {
      const wrapper = mountRcPrivateRegistry({ enabled: true });

      expect(wrapper.emitted('update:enabled')).toBeUndefined();
    });
  });

  describe('auth secret draft', () => {
    it('should pass authSecretDraft to the auth secret selector as preSelect', () => {
      const draft = {
        selected: AUTH_TYPE._IMAGE_PULL_SECRET, publicKey: 'user', privateKey: 'pass'
      };
      const wrapper = mountRcPrivateRegistry({ enabled: true, authSecretDraft: draft });

      expect(wrapper.findComponent(RcSelectOrCreateAuthSecret).props('preSelect')).toStrictEqual(draft);
    });

    it('should emit update:authSecretDraft when the auth secret selector emits inputauthval', async() => {
      const draft = {
        selected: AUTH_TYPE._IMAGE_PULL_SECRET, publicKey: 'user', privateKey: ''
      };
      const wrapper = mountRcPrivateRegistry({ enabled: true });

      await wrapper.findComponent(RcSelectOrCreateAuthSecret).vm.$emit('inputauthval', draft);

      expect(wrapper.emitted('update:authSecretDraft')).toStrictEqual([[draft]]);
    });
  });
});
