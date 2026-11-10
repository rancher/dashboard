import { ComputedRef, defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { useExtensionCards } from '@shell/composables/useExtensionCards';
import { Card, CardLocation, ExtensionPoint } from '@shell/core/types';

const mockRoute: any = {
  params: {
    product: 'explorer', resource: 'pod', cluster: 'local', id: 'nginx'
  },
  query: {},
  hash:  '',
  name:  'c-cluster-product-resource-id',
  meta:  {},
};

jest.mock('vue-router', () => ({ useRoute: () => mockRoute }));

const component = () => Promise.resolve({ template: '<div />' });

/**
 * Run the composable inside a component so `inject` has an instance to resolve `$extension` from
 */
const run = (uiConfig?: { [location: string]: any[] }): ComputedRef<Card[]> => {
  let result: ComputedRef<Card[]> | undefined;

  const extension = uiConfig ? { getUIConfig: (type: string, location: string) => (type === ExtensionPoint.CARD ? uiConfig[location] : undefined) || [] } : undefined;

  mount(defineComponent({
    setup() {
      result = useExtensionCards(CardLocation.RESOURCE_DETAIL_CARD);

      return () => h('div');
    }
  }), { global: { provide: { $extension: extension } } });

  return result as ComputedRef<Card[]>;
};

describe('fx: useExtensionCards', () => {
  it('should return nothing when the extension manager is not available', () => {
    expect(run().value).toStrictEqual([]);
  });

  it('should return nothing when no extension registered a card for the location', () => {
    expect(run({
      [CardLocation.CLUSTER_DASHBOARD_CARD]: [{
        label: 'elsewhere', component, locationConfig: {}
      }]
    }).value).toStrictEqual([]);
  });

  it('should return a card registered for the location with no location config', () => {
    const card = {
      label: 'everywhere', component, locationConfig: {}
    };

    expect(run({ [CardLocation.RESOURCE_DETAIL_CARD]: [card] }).value).toStrictEqual([card]);
  });

  it('should only return cards whose location config matches the current route', () => {
    const match = {
      label: 'pods', component, locationConfig: { resource: ['pod'] }
    };
    const noMatch = {
      label: 'config maps', component, locationConfig: { resource: ['configmap'] }
    };

    expect(run({ [CardLocation.RESOURCE_DETAIL_CARD]: [match, noMatch] }).value).toStrictEqual([match]);
  });

  it.each([
    ['resource', { resource: ['pod'] }, true],
    ['resource wildcard', { resource: ['*'] }, true],
    ['cluster', { cluster: ['local'] }, true],
    ['id', { id: ['nginx'] }, true],
    ['product', { product: ['explorer'] }, true],
    ['another cluster', { cluster: ['other'] }, false],
    ['another product', { product: ['manager'] }, false],
    ['resource and cluster', { resource: ['pod'], cluster: ['other'] }, false],
  ])('should honour the %s location config', (_label, locationConfig, expected) => {
    const card = {
      label: 'card', component, locationConfig
    };

    expect(run({ [CardLocation.RESOURCE_DETAIL_CARD]: [card] }).value.length === 1).toBe(expected);
  });

  it('should sort cards by weight, highest first', () => {
    const light = {
      label: 'light', component, locationConfig: {}, weight: 1
    };
    const heavy = {
      label: 'heavy', component, locationConfig: {}, weight: 10
    };
    const negative = {
      label: 'negative', component, locationConfig: {}, weight: -1
    };

    expect(run({ [CardLocation.RESOURCE_DETAIL_CARD]: [light, negative, heavy] }).value).toStrictEqual([heavy, light, negative]);
  });

  it('should treat a card with no weight as weight zero', () => {
    const none = {
      label: 'none', component, locationConfig: {}
    };
    const heavy = {
      label: 'heavy', component, locationConfig: {}, weight: 10
    };
    const negative = {
      label: 'negative', component, locationConfig: {}, weight: -1
    };

    expect(run({ [CardLocation.RESOURCE_DETAIL_CARD]: [none, negative, heavy] }).value).toStrictEqual([heavy, none, negative]);
  });

  it('should keep the registration order of cards with the same weight', () => {
    const first = {
      label: 'first', component, locationConfig: {}, weight: 5
    };
    const second = {
      label: 'second', component, locationConfig: {}, weight: 5
    };
    const third = {
      label: 'third', component, locationConfig: {}, weight: 5
    };

    expect(run({ [CardLocation.RESOURCE_DETAIL_CARD]: [first, second, third] }).value).toStrictEqual([first, second, third]);
  });
});
