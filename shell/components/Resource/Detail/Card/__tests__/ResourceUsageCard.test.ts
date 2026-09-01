import { mount } from '@vue/test-utils';
import ResourceUsageCard from '@shell/components/Resource/Detail/Card/ResourceUsageCard/index.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import { createStore } from 'vuex';

describe('component: ResourceUsageCard', () => {
  const title = 'TITLE';
  const used = 20;
  const available = 100;
  const store = createStore({});
  const unit = 'UNIT';

  it('should pass the title passed in to the card title prop', async() => {
    const wrapper = mount(ResourceUsageCard, {
      props: {
        title, used, available
      },
      global: { provide: { store } }
    });

    const card = wrapper.findComponent(Card);

    expect(card.props('title')).toStrictEqual(title);
  });

  it('should render information in the appropriate places', async() => {
    const wrapper = mount(ResourceUsageCard, {
      props: {
        title, used, available
      },
      global: { provide: { store } }
    });

    const numerical = wrapper.find('.numerical');
    const usedDiv = numerical.find('.used');
    const data = numerical.find('.data');

    expect(usedDiv.element.innerHTML).toStrictEqual('component.resource.detail.card.resourceUsage.used');
    expect(data.find('.amount').element.innerHTML).toStrictEqual(`component.resource.detail.card.resourceUsage.amount-{"used":"${ used }","available":"${ available }"}`);
    expect(data.find('.unit').exists()).toBeFalsy();
    expect(data.find('.spacer').exists()).toBeTruthy();
    expect(data.find('.percentage').element.innerHTML).toStrictEqual('20%');
  });

  it('should render units when passed', async() => {
    const wrapper = mount(ResourceUsageCard, {
      props: {
        title, used, available, unit
      },
      global: { provide: { store } }
    });

    const numerical = wrapper.find('.numerical');
    const data = numerical.find('.data');

    expect(data.find('.unit').element.innerHTML).toStrictEqual(unit);
  });

  it('should handle formatters properly', async() => {
    const wrapper = mount(ResourceUsageCard, {
      props: {
        title, used, available, usedFormatter: (n: number) => `used: ${ n }`, availableFormatter: (n: number) => `available: ${ n }`
      },
      global: { provide: { store } }
    });

    const numerical = wrapper.find('.numerical');
    const data = numerical.find('.data');

    expect(data.find('.amount').element.innerHTML).toStrictEqual(`component.resource.detail.card.resourceUsage.amount-{"used":"used: ${ used }","available":"available: ${ available }"}`);
  });
});
