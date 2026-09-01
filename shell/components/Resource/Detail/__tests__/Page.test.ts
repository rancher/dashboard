import { mount } from '@vue/test-utils';
import Page from '@shell/components/Resource/Detail/Page.vue';

describe('component: ResourceDetailPage', () => {
  it('should render container with resource-detail-class and hide the slots not used', async() => {
    const wrapper = mount(Page);

    expect(wrapper.find('.resource-detail-page').exists()).toBeTruthy();

    expect(wrapper.find('.top-area').exists()).toBeFalsy();
    expect(wrapper.find('.middle-area').exists()).toBeFalsy();
    expect(wrapper.find('.bottom-area').exists()).toBeFalsy();
  });

  it('should render each of the slots with appropriate content', async() => {
    const topArea = 'TOP_AREA';
    const middleArea = 'MIDDLE_AREA';
    const bottomArea = 'BOTTOM_AREA';

    const wrapper = mount(Page, {
      slots: {
        'top-area':    topArea,
        'middle-area': middleArea,
        'bottom-area': bottomArea
      }
    });

    expect(wrapper.find('.top-area').element.innerHTML.trim()).toStrictEqual(topArea);
    expect(wrapper.find('.middle-area').element.innerHTML.trim()).toStrictEqual(middleArea);
    expect(wrapper.find('.bottom-area').element.innerHTML.trim()).toStrictEqual(bottomArea);
  });
});
