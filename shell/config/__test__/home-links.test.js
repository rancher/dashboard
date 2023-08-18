import { fetchLinks } from '@shell/config/home-links.js';

jest.mock('@shell/assets/translations-cn/en-us.yaml', () => ({
  locale: {
    'en-us':   'English',
    'zh-hans': '简体中文',
    none:      '(None)',
  }
}));

describe('fx: fetchLinks', () => {
  const $store = {
    getters: {
      'management/byId': (type, id) => {
        if (type === 'cluster' || type === 'management.cattle.io.cluster') {
          return {
            metadata:        { state: { name: 'active' } },
            nameDisplay:     'local',
            availableCpu:    '',
            availableMemory: '',
            id:              'local',
          };
        }
      },
      'i18n/t':       (type, p) => p?.name ? type + p.name : type,
      'catalog/repo': ({ repoType, repoName }) => ({
        doAction:         t => t,
        waitForOperation: t => t,
      }),
      'catalog/charts': [{}],
    },
    dispatch: (key) => {
      return new Promise((resolve, reject) => {
        const store = {
          'management/find': (key, a) => {
            return { value: '' };
          },
          'management/request': (key, a) => {
            return key;
          },
        };

        if (store[key]) {
          return resolve(store[key]());
        }
      });
    },
    rootGetters: {
      'management/byId':     (type, id) => ({ nameDisplay: id }),
      'type-map/optionsFor': type => ({ type }),
      'i18n/t':              (type, p) => p?.name ? type + p.name : type
    }
  };

  it('should return cn forum link if the language is zh-hans', async() => {
    const hasSupport = true;
    const isSupportPage = true;

    const localThis = {
      $store,
      t: $store.getters['i18n/t'],
    };

    const result = await fetchLinks($store, hasSupport, isSupportPage, localThis.t);

    const testCases = [
      ['forums', 'https://forums.rancher.cn/'],
      ['mirror', 'https://mirror.rancher.cn/']
    ];

    testCases.forEach(([key, value]) => {
      const link = result.defaults.find(link => link.key === key);

      expect(link.value).toBe(value);
    });
  });
});
