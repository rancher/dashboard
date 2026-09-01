import { shallowMount } from '@vue/test-utils';
import CollapsibleCard from '@shell/components/CollapsibleCard.vue';

describe('component: CollapsibleCard', () => {
  it('should render component with the correct data applied', () => {
    const wrapper = shallowMount(CollapsibleCard, {
      props: { title: 'some-card-title' },
      slots: {
        'header-right': '<p>some stuff for header</p>',
        content:        '<p>some content</p>'
      }
    });

    const cardWrapper = wrapper.find('.collapsible-card');
    const cardHeader = wrapper.find('.collapsible-card-header');
    const cardBody = wrapper.find('.collapsible-card-body');

    expect(cardWrapper.exists()).toBe(true);

    expect(cardHeader.exists()).toBe(true);
    expect(cardHeader.find('h2 span').text()).toBe('some-card-title');
    expect(cardHeader.find('p').exists()).toBe(true);
    expect(cardHeader.find('p').text()).toBe('some stuff for header');
    expect(cardHeader.find('i').exists()).toBe(true);
    expect(cardHeader.find('i').classes()).toContain('icon-chevron-up');

    expect(cardBody.exists()).toBe(true);
    expect(cardBody.find('p').exists()).toBe(true);
    expect(cardBody.find('p').text()).toBe('some content');
  });

  it('clicking on card header should emit event', () => {
    const wrapper = shallowMount(CollapsibleCard, {
      props: { title: 'some-card-title' },
      slots: {
        'header-right': '<p>some stuff for header</p>',
        content:        '<p>some content</p>'
      }
    });

    const cardHeader = wrapper.find('.collapsible-card-header');

    cardHeader.trigger('click');

    expect(wrapper.emitted('toggleCollapse')).toHaveLength(1);
    expect(wrapper.emitted('toggleCollapse')![0][0]).toBe(true);
  });

  it('clicking on card title should emit event', () => {
    const wrapper = shallowMount(CollapsibleCard, {
      props: { title: 'some-card-title', isTitleClickable: true },
      slots: {
        'header-right': '<p>some stuff for header</p>',
        content:        '<p>some content</p>'
      }
    });

    const cardHeaderTitle = wrapper.find('.collapsible-card-header h2 span');

    cardHeaderTitle.trigger('click');

    expect(wrapper.emitted('titleClick')).toHaveLength(1);
  });
});
