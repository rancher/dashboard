import { mount } from '@vue/test-utils';

import DetailText from '@shell/components/DetailText.vue';

jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));

describe('component: DetailText', () => {
  const defaultMocks = {
    $store: {
      getters: {
        'i18n/t':    jest.fn((key: string) => `%${ key }%`),
        'prefs/get': jest.fn(() => true),
      }
    }
  };

  describe('concealment', () => {
    it('should not render the actual secret value in the content area when concealed', () => {
      const secretValue = 'super-secret-password-xyz';
      const wrapper = mount(DetailText, {
        props: {
          value:   secretValue,
          conceal: true,
          label:   'Password',
        },

        global: {
          mocks:      defaultMocks,
          directives: {
            'clean-html':    () => {},
            'clean-tooltip': () => {},
            t:               () => {},
          },
          stubs: {
            CopyToClipboard: true,
            CodeMirror:      true,
          },
        },
      });

      const concealedSpan = wrapper.find('[data-testid="detail-top_html"]');

      expect(concealedSpan.exists()).toBe(true);
      expect(concealedSpan.classes()).toContain('conceal');
      expect(concealedSpan.text()).not.toContain(secretValue);
    });

    it('should render the actual value when not concealed', () => {
      const visibleValue = 'visible-value-123';
      const wrapper = mount(DetailText, {
        props: {
          value:   visibleValue,
          conceal: false,
          label:   'Data',
        },

        global: {
          mocks:      defaultMocks,
          directives: {
            'clean-html': (el: HTMLElement, binding: { value: string }) => {
              el.innerHTML = binding.value;
            },
            'clean-tooltip': () => {},
            t:               () => {},
          },
          stubs: {
            CopyToClipboard: true,
            CodeMirror:      true,
          },
        },
      });

      const contentSpan = wrapper.find('[data-testid="detail-top_html"]');

      expect(contentSpan.exists()).toBe(true);
      expect(contentSpan.classes()).not.toContain('conceal');
    });

    it('should not render JSON secret values in CodeMirror when concealed', () => {
      const jsonSecret = '{"api_key": "secret-key-123"}';
      const wrapper = mount(DetailText, {
        props: {
          value:   jsonSecret,
          conceal: true,
          label:   'Config',
        },

        global: {
          mocks:      defaultMocks,
          directives: {
            'clean-html':    () => {},
            'clean-tooltip': () => {},
            t:               () => {},
          },
          stubs: {
            CopyToClipboard: true,
            CodeMirror:      true,
          },
        },
      });

      const codeMirror = wrapper.findComponent({ name: 'CodeMirror' });

      expect(codeMirror.exists()).toBe(false);

      const concealedSpan = wrapper.find('[data-testid="detail-top_html"]');

      expect(concealedSpan.exists()).toBe(true);
      expect(concealedSpan.classes()).toContain('conceal');
      expect(concealedSpan.text()).not.toContain('secret-key-123');
    });
  });
});
