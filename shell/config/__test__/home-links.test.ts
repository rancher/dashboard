import { createStore } from 'vuex';
import { ensureSupportLink } from '@shell/config/home-links.js';
import { getters, state, mutations } from '@shell/store/i18n.js';

jest.mock('@shell/assets/translations/en-us.yaml', () => ({
  locale: {
    'en-us':   'English',
    'zh-hans': '简体中文',
    none:      '(None)',
  }
}));

describe('fx: ensureSupportLink', () => {
  const store = createStore({
    state,
    getters: {
      'i18n/selectedLocaleLabel': getters.selectedLocaleLabel,
      'i18n/t':                   getters.t,
    },
    mutations,
  });

  store.commit('loadTranslations', {
    locale:       'zh-zhans',
    translations: {
      locale: {
        'en-us':   'English',
        'zh-hans': '简体中文',
        none:      '(None)',
      }
    }
  });

  const testCases = [
    ['en-us', false],
    ['zh-hans', true],
    ['none', false],
    [null, false],
  ];

  it.each(testCases)('should return cn forum link if the language is zh-hans', (language:String, value) => {
    store.commit('setSelected', language);

    const links = { defaults: [], custom: [] };
    const hasSupport = true;
    const isSupportPage = true;

    const localThis = {
      $store: store,
      t:      store.getters['i18n/t'],
    };

    const result = ensureSupportLink(links, hasSupport, isSupportPage, localThis.t, store);

    expect(!!result.defaults.find((link) => link.key === 'cnforums')).toBe(value);
  });
});
