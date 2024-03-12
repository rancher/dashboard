import { mount } from '@vue/test-utils';
import Banzai from '@shell/edit/logging.banzaicloud.io.output/index.vue';

describe('view: logging.banzaicloud.io.output', () => {
  it.each([
    ['http://localhost:3100', []],
    ['not a proper URL', ['logging.loki.urlInvalid']],
  ])('should validate Loki URL on save', (url, expectation) => {
    const wrapper = mount(Banzai, {
      data:      () => ({ selectedProvider: 'loki' }),
      propsData: {
        value: {
          save: jest.fn(),
          spec: { loki: { url } }
        }
      },
      mocks: {
        $store: {
          getters: {
            currentStore:              () => 'current_store',
            'management/schemaFor':    jest.fn(),
            'current_store/all':       jest.fn(),
            'current_store/schemaFor': jest.fn(),
            'cluster/all':             jest.fn(),
            'type-map/isSpoofed':      jest.fn(),
            'i18n/t':                  jest.fn().mockImplementation((key: string) => key),
            namespaces:                () => ({}),
          }
        },
        $route: {
          name:  'whatever',
          query: { AS: '' }
        },
        $router: { replace: jest.fn() },
      }
    });
    const fakeDone = jest.fn();

    (wrapper.vm as any).saveSettings(fakeDone);

    expect((wrapper.vm as any).errors).toStrictEqual(expectation);
  });
});
