import { mount } from '@vue/test-utils';
import ApplicationCard from '@shell/components/cards/ApplicationCard.vue';

describe('component: ApplicationCard', () => {
  const wrapper = mount(ApplicationCard, {
    slots: {
      cardIcon:   '<i class="icon icon-fw icon-epinio"></i>',
      'top-left': '<h1>Routes</h1> <ul><li> <a target="_blank" rel="noopener noreferrer nofollow"> route1 </a> </li> <li><a target="_blank" rel="noopener noreferrer nofollow"> route1 </a></li> </ul>',
    }
  });

  it.each([
    'cardIcon',
    'top-left',
    'top-right',
    'resourcesCount',
  ])('should have a populated %p slot', (slot) => {
    const content = '<div>text</div>';
    const ele = mount(ApplicationCard, { slots: { [slot]: content } });

    expect(ele.find(`[data-testid="${ slot }-section"`).find('div').html()).toContain(content);
  });

  it('should have card-icon slot with an icon', () => {
    expect(wrapper.find('[data-testid="cardIcon-section"]').find('i').classes()).toContain('icon-epinio');
  });
});
