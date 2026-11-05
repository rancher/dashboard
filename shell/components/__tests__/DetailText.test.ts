import { mount } from '@vue/test-utils';

import DetailText from '@shell/components/DetailText.vue';
import { readTextFromClipboard } from '@shell/utils/clipboard';

jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn(), readTextFromClipboard: jest.fn() }));

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

  describe('an editable value', () => {
    const mountEditable = (props: Record<string, unknown> = {}) => mount(DetailText, {
      props: {
        value: 'abc', label: 'View', editable: true, ...props
      },
      global: {
        mocks: {
          $store: {
            getters: {
              ...defaultMocks.$store.getters,
              'i18n/exists': () => false,
            }
          }
        },
        directives: {
          'clean-html': () => {}, 'clean-tooltip': () => {}, t: () => {}
        },
        stubs: { CopyToClipboard: true, CodeMirror: true },
      },
    });
    const flush = () => new Promise((resolve) => setTimeout(resolve));

    it('should be a text box named by its label, in place of the text', () => {
      const wrapper = mountEditable();
      const box = wrapper.find('textarea');

      expect((box.element as HTMLTextAreaElement).value).toBe('abc');
      expect(box.attributes('aria-labelledby')).toBe(wrapper.find('h5').attributes('id'));
      expect(wrapper.find('[data-testid="detail-top_html"]').exists()).toBe(false);
    });

    it('should hand back what is typed', async() => {
      const wrapper = mountEditable();

      await wrapper.find('textarea').setValue('typed');

      expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['typed']);
    });

    it('should say when its value is wrong, and where that is said', () => {
      const box = mountEditable({ invalid: true, describedBy: 'problem-1' }).find('textarea');

      expect(box.attributes('aria-invalid')).toBe('true');
      expect(box.attributes('aria-describedby')).toBe('problem-1');
    });

    it('should leave the text as it was shown without editable', () => {
      expect(mountEditable({ editable: false }).find('textarea').exists()).toBe(false);
    });

    describe('with paste', () => {
      it('should offer Paste where Copy goes, framed as with Copy', () => {
        const wrapper = mountEditable({ copy: false, paste: true });

        expect(wrapper.find('.action-group [data-testid="detail-text-paste"]').exists()).toBe(true);
        expect(wrapper.classes()).toContain('with-copy');
      });

      it('should hand back what the clipboard holds', async() => {
        jest.mocked(readTextFromClipboard).mockResolvedValueOnce('pasted');
        const wrapper = mountEditable({ copy: false, paste: true });

        await wrapper.find('[data-testid="detail-text-paste"]').trigger('click');
        await flush();

        expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['pasted']);
      });

      it.each([
        ['is empty', () => Promise.resolve('')],
        ['can\'t be read', () => Promise.reject(new Error('denied'))],
      ])('should hand back nothing when the clipboard %s', async(_, read) => {
        jest.mocked(readTextFromClipboard).mockImplementationOnce(read);
        const wrapper = mountEditable({ copy: false, paste: true });

        await wrapper.find('[data-testid="detail-text-paste"]').trigger('click');
        await flush();

        expect(wrapper.emitted('update:value')).toBeUndefined();
      });

      it('should not offer Paste unless asked', () => {
        expect(mountEditable().find('[data-testid="detail-text-paste"]').exists()).toBe(false);
      });
    });
  });
});
