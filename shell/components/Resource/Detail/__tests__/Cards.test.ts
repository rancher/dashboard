import { mount } from '@vue/test-utils';
import { ref } from 'vue';

import Cards from '@shell/components/Resource/Detail/Cards.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';

const mockExtensionCards = ref<any[]>([]);

jest.mock('@shell/composables/useExtensionCards', () => ({ useExtensionCards: () => mockExtensionCards }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => `translated: ${ key }` }) }));
jest.mock('vuex', () => ({ useStore: () => ({ getters: {} }) }));
jest.mock('@shell/components/Resource/Detail/Card/ExtrasCard.vue', () => ({
  name:     'ExtrasCard',
  template: '<div data-testid="extras-card" />'
}));

const resourceCard = (name: string) => ({
  component: {
    name,
    props:    ['title'],
    template: `<div data-testid="${ name }">{{ title }}</div>`
  },
  props: { title: `${ name } title` }
});

const extensionCardComponent = {
  name:     'ExtensionCardBody',
  props:    ['resource'],
  template: '<div data-testid="extension-card-body">{{ resource.id }}</div>'
};

const resource = { id: 'default/nginx', cards: [] as any[] };

describe('component: Resource/Detail/Cards', () => {
  beforeEach(() => {
    mockExtensionCards.value = [];
  });

  it('should render nothing when there are no resource cards and no extension cards', () => {
    const wrapper = mount(Cards, { props: { resource: { ...resource, cards: [] } } });

    expect(wrapper.find('.spaced-row').exists()).toBe(false);
  });

  it('should render the cards provided by the resource', () => {
    const wrapper = mount(Cards, { props: { resource: { ...resource, cards: [resourceCard('card-one'), resourceCard('card-two')] } } });

    expect(wrapper.find('[data-testid="card-one"]').text()).toBe('card-one title');
    expect(wrapper.find('[data-testid="card-two"]').text()).toBe('card-two title');
  });

  it('should ignore empty entries in the resource cards', () => {
    const wrapper = mount(Cards, { props: { resource: { ...resource, cards: [null, undefined] } } });

    expect(wrapper.find('.spaced-row').exists()).toBe(false);
  });

  it('should render an extension card in the shared card component with its label as the title', () => {
    mockExtensionCards.value = [{ label: 'Extension card', component: extensionCardComponent }];

    const wrapper = mount(Cards, { props: { resource } });

    expect(wrapper.findComponent(Card).props('title')).toBe('Extension card');
    expect(wrapper.find('[data-testid="extension-card-body"]').exists()).toBe(true);
  });

  it('should use the translation of labelKey over label for an extension card title', () => {
    mockExtensionCards.value = [{
      label: 'Extension card', labelKey: 'some.key', component: extensionCardComponent
    }];

    const wrapper = mount(Cards, { props: { resource } });

    expect(wrapper.findComponent(Card).props('title')).toBe('translated: some.key');
  });

  it('should pass the resource to the extension card component', () => {
    mockExtensionCards.value = [{ label: 'Extension card', component: extensionCardComponent }];

    const wrapper = mount(Cards, { props: { resource } });

    expect(wrapper.find('[data-testid="extension-card-body"]').text()).toBe('default/nginx');
  });

  it('should render extension cards after the cards provided by the resource', () => {
    mockExtensionCards.value = [{ label: 'Extension card', component: extensionCardComponent }];

    const wrapper = mount(Cards, { props: { resource: { ...resource, cards: [resourceCard('card-one')] } } });

    const html = wrapper.html();

    expect(html.indexOf('card-one')).toBeLessThan(html.indexOf('extension-card-body'));
  });

  it('should render extension cards but not the resource cards when showResourceCards is false', () => {
    mockExtensionCards.value = [{ label: 'Extension card', component: extensionCardComponent }];

    const wrapper = mount(Cards, { props: { resource: { ...resource, cards: [resourceCard('card-one')] }, showResourceCards: false } });

    expect(wrapper.find('[data-testid="card-one"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="extension-card-body"]').exists()).toBe(true);
  });

  it('should render nothing when showResourceCards is false and there are no extension cards', () => {
    const wrapper = mount(Cards, { props: { resource: { ...resource, cards: [resourceCard('card-one')] }, showResourceCards: false } });

    expect(wrapper.find('.spaced-row').exists()).toBe(false);
  });

  it.each([
    [0, 1, true],
    [1, 1, true],
    [2, 0, true],
    [2, 1, false],
    [3, 0, false],
    [1, 3, false],
  ])('should show the extras card with %s resource cards and %s extension cards: %s', (resourceCardCount, extensionCardCount, expected) => {
    mockExtensionCards.value = Array.from({ length: extensionCardCount }, (_, i) => ({ label: `Extension card ${ i }`, component: extensionCardComponent }));

    const cards = Array.from({ length: resourceCardCount }, (_, i) => resourceCard(`card-${ i }`));
    const wrapper = mount(Cards, { props: { resource: { ...resource, cards } } });

    expect(wrapper.find('[data-testid="extras-card"]').exists()).toBe(expected);
  });
});
