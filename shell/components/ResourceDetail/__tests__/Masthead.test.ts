import { mount, RouterLinkStub } from '@vue/test-utils';
import { _VIEW } from '@shell/config/query-params';
import Masthead from '@shell/components/ResourceDetail/Masthead.vue';

const mockedStore = () => {
  return {
    getters: {
      currentStore:              () => 'current_store',
      currentProduct:            { inStore: 'cluster' },
      isExplorer:                false,
      currentCluster:            {},
      'type-map/labelFor':       jest.fn(),
      'type-map/optionsFor':     jest.fn(),
      'current_store/schemaFor': jest.fn(),
    },
  };
};

const requiredSetup = () => {
  return {
    stubs: {
      'router-link': RouterLinkStub,
      LiveDate:      true
    },
    mocks: { $store: mockedStore() }
  };
};

describe('component: Masthead', () => {
  it.each([
    ['hidden', '', false, { displayName: 'admin', location: { id: 'resource-id' } }, false, false],
    ['plain-text', 'admin', true, { displayName: 'admin', location: null }, false, true],
    ['link', 'foo', true, { displayName: 'foo', location: { id: 'resource-id' } }, true, false],
  ])('"Created By" should be %p, with text: %p', (
    _,
    text,
    showCreatedBy,
    createdBy,
    showLink,
    showPlainText,
  ) => {
    const wrapper = mount(Masthead, {
      props: {
        mode:  _VIEW,
        value: {
          showCreatedBy,
          createdBy,
        },
      },
      global: { ...requiredSetup() }
    });

    const container = wrapper.find('[data-testid="masthead-subheader-createdBy"]');
    const link = wrapper.find('[data-testid="masthead-subheader-createdBy-link"]');
    const plainText = wrapper.find('[data-testid="masthead-subheader-createdBy_plain-text"]');

    expect(link.exists()).toBe(showLink);
    expect(plainText.exists()).toBe(showPlainText);
    expect(showLink || showPlainText ? container.element.textContent : '').toContain(text);
  });
});
