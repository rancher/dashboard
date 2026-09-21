import { mount } from '@vue/test-utils';
import CopyCode from '@shell/components/CopyCode.vue';
import { announce } from '@shell/utils/aria-announce';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

jest.mock('@shell/utils/aria-announce', () => ({ announce: jest.fn() }));

const mountWith = (translations: Record<string, string> = {}) => mount(CopyCode, {
  slots:  { default: '<div></div>' },
  global: {
    mocks: {
      $store: {
        getters: {
          'i18n/exists': (key: string) => key in translations,
          'i18n/t':      (key: string) => translations[key],
        }
      }
    }
  }
});

describe('component: CopyCode', () => {
  beforeEach(() => (announce as jest.Mock).mockClear());

  it('should emit copied after click', async() => {
    const wrapper = mountWith();

    await wrapper.find('code').trigger('click');

    expect(wrapper.emitted('copied')).toHaveLength(1);
  });

  // The only visible feedback is a tooltip, which a screen reader never reads out.
  it('should announce the copy, since the tooltip alone is silent', async() => {
    const wrapper = mountWith({ 'asyncButton.copy.success': 'Copiado!' });

    await wrapper.find('code').trigger('click');
    await wrapper.vm.$nextTick();

    expect(announce).toHaveBeenCalledWith('Copiado!');
  });

  it('should fall back to English when the host has no translation for the key', async() => {
    const wrapper = mountWith();

    await wrapper.find('code').trigger('click');
    await wrapper.vm.$nextTick();

    expect(announce).toHaveBeenCalledWith('Copied!');
  });
});
