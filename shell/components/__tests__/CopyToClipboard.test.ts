import { mount } from '@vue/test-utils';
import CopyToClipboard from '@shell/components/CopyToClipboard.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';

jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn(() => Promise.resolve({})) }));

const TRANSLATED = {
  'copyToClipboard.action':  'Copiar',
  'copyToClipboard.waiting': 'A copiar&hellip;',
  'copyToClipboard.success': 'Copiado!',
  'copyToClipboard.error':   'Erro ao copiar',
};

const mountWith = (translations: Record<string, string>) => mount(CopyToClipboard, {
  props:  { text: 'some-value' },
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

describe('component: CopyToClipboard', () => {
  it('should hand translated labels to the button, so what is announced is translated too', () => {
    const asyncButton = mountWith(TRANSLATED).findComponent(AsyncButton);

    expect(asyncButton.props('actionLabel')).toStrictEqual('Copiar');
    expect(asyncButton.props('waitingLabel')).toStrictEqual('A copiar&hellip;');
    expect(asyncButton.props('successLabel')).toStrictEqual('Copiado!');
    expect(asyncButton.props('errorLabel')).toStrictEqual('Erro ao copiar');
  });

  // A newer @rancher/shell can run inside an older Rancher that has none of these keys. The
  // button must keep reading "Copy", not "%copyToClipboard.action%".
  it('should fall back to English when the host has no translations for the keys', () => {
    const asyncButton = mountWith({}).findComponent(AsyncButton);

    expect(asyncButton.props('actionLabel')).toStrictEqual('Copy');
    expect(asyncButton.props('waitingLabel')).toStrictEqual('Copying...');
    expect(asyncButton.props('successLabel')).toStrictEqual('Copied!');
    expect(asyncButton.props('errorLabel')).toStrictEqual('Error Copying');
  });
});
