import { mount } from '@vue/test-utils';
import StateCard from '@shell/components/Resource/Detail/Card/StateCard/index.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import ResourceRow from '@shell/components/Resource/Detail/ResourceRow.vue';
jest.mock('vuex', () => ({ useStore: () => { } }));

describe('component: StateCard', () => {
  const title = 'TITLE';
  const counts = [{ label: 'label2', count: 3 }];
  const row: any = {
    label: 'label',
    to:    'to',
    color: 'success',
    counts,
  };

  it('should pass the title passed in to the card title prop', async() => {
    const wrapper = mount(StateCard, {
      props: {
        title,
        rows: []
      },
    });

    const card = wrapper.findComponent(Card);

    expect(card.props('title')).toStrictEqual(title);
  });

  it('should have resource-rows class', async() => {
    const wrapper = mount(StateCard, {
      props: {
        title,
        rows: []
      },
    });

    expect(wrapper.find('.resource-rows').exists()).toBeTruthy();
  });

  it('should pass props from rows to ResourceRows correctly', async() => {
    const wrapper = mount(StateCard, {
      props: {
        title,
        rows: [row]
      },
      global: { stubs: ['router-link'] }
    });

    const resourceRows = wrapper.findComponent(ResourceRow);

    expect(resourceRows.props()).toStrictEqual(row);
  });
});
