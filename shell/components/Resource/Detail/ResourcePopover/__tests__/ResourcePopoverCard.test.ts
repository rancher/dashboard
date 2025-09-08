import { mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourcePopoverCard from '@shell/components/Resource/Detail/ResourcePopover/ResourcePopoverCard.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';

const mockI18n = { t: (key: string) => key };

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => mockI18n }));

describe('component: ResourcePopoverCard.vue', () => {
  let wrapper: VueWrapper<any>;

  const mockResource = {
    nameDisplay: 'My Test Resource',
    glance:      [
      {
        label:   'Status',
        content: 'Active',
      },
      {
        label:         'Type',
        content:       'SomeType',
        formatter:     'SomeFormatterComponent',
        formatterOpts: { opt1: 'value1' }
      },
      {
        label:   'Created',
        content: '2023-01-01',
      }
    ],
  };

  const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

  const SomeFormatterComponent = {
    name:     'SomeFormatterComponent',
    props:    ['value', 'opt1', 'id'],
    template: '<div :id="id">Formatted: {{ value }} with {{ opt1 }}</div>',
  };

  function createWrapper(resource: any) {
    return mount(ResourcePopoverCard, {
      props:  { resource },
      global: {
        plugins:    [store],
        stubs:      { ActionMenu: true },
        components: { SomeFormatterComponent }
      },
    });
  }

  beforeEach(() => {
    wrapper = createWrapper(mockResource);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render the Card with the correct title', () => {
    const card = wrapper.findComponent(Card);

    expect(card.exists()).toBe(true);
    expect(card.props('title')).toBe(mockResource.nameDisplay);
  });

  it('should render the ActionMenu with the correct resource prop', () => {
    const actionMenu = wrapper.findComponent(ActionMenu);

    expect(actionMenu.exists()).toBe(true);
    expect(actionMenu.props('resource')).toStrictEqual(mockResource);
  });

  it('should emit "action-invoked" when ActionMenu emits it', async() => {
    const actionMenu = wrapper.findComponent(ActionMenu);

    await actionMenu.vm.$emit('action-invoked');

    expect(wrapper.emitted('action-invoked')).toHaveLength(1);
  });

  it('should render a row for each item in resource.glance', () => {
    const rows = wrapper.findAll('.row');

    expect(rows).toHaveLength(mockResource.glance.length);
  });

  it('should render the correct label and value for each glance item', () => {
    const rows = wrapper.findAll('.row');

    rows.forEach((row, i) => {
      const glanceItem = mockResource.glance[i];
      const label = row.find('label');
      const value = row.find('.value');

      expect(label.text()).toBe(glanceItem.label);
      if (glanceItem.formatter) {
        return;
      }

      expect(value.text()).toBe(glanceItem.content);
    });
  });

  it('should render a dynamic component when a formatter is provided', () => {
    const formatterComponent = wrapper.findComponent(SomeFormatterComponent);

    expect(formatterComponent.exists()).toBe(true);
    expect(formatterComponent.props('value')).toBe(mockResource.glance[1].content);
    expect(formatterComponent.props('opt1')).toBe(mockResource.glance[1].formatterOpts.opt1);
  });

  it('should generate a unique ID for label `for` and value `id` attributes', () => {
    const firstGlanceItem = mockResource.glance[0];
    const expectedId = `value-${ firstGlanceItem.label }:${ firstGlanceItem.content }`.toLowerCase().replaceAll(' ', '');

    const label = wrapper.find('label');
    const value = wrapper.find('.value');

    expect(label.attributes('for')).toBe(expectedId);
    expect(value.attributes('id')).toBe(expectedId);
  });

  it('should add a specific ID to the first glance item value', () => {
    const firstValueSpan = wrapper.find('#first-glance-item');

    expect(firstValueSpan.exists()).toBe(true);
    // This will be the span inside the first .value div
    expect(firstValueSpan.text()).toBe(mockResource.glance[0].content);

    const secondValue = wrapper.findAll('.value')[1];

    expect(secondValue.find('#first-glance-item').exists()).toBe(false);
  });
});
