import { mount } from '@vue/test-utils';
import ApplicationCard from '@shell/components/cards/ApplicationCard.vue';

describe('component: CopyCode', () => {
  const wrapper = mount(ApplicationCard, {
    slots: {
      cardIcon:         '<i class="icon icon-fw icon-epinio"></i>',
      'top-left':       '<h1>Routes</h1> <ul><li> <a target="_blank" rel="noopener noreferrer nofollow"> route1 </a> </li> <li><a target="_blank" rel="noopener noreferrer nofollow"> route1 </a></li> </ul>',
      'top-right':      '20 days ago',
      resourcesCount: '<div> 2 Services</div> <div>3 Configs</div> <div>4 Environment variables</div>'
    }
  });

  it('should have a populated card-icon slot', () => {
    expect(wrapper.find('[data-testid="icon-slot-section"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="icon-slot-section"]').find('i').exists()).toBe(true);
    expect(wrapper.find('[data-testid="icon-slot-section"]').find('i').classes()).toContain('icon-epinio');
  });

  it('should have a populated top-left slot', () => {
    const ele = wrapper.find('[data-testid="top-left-section"]');

    expect(ele.find('ul').exists()).toBe(true);
    expect(ele.find('ul').findAll('li')).toHaveLength(2);
    expect(ele.find('ul').findAll('li').at(0).find('a')
      .exists()).toBe(true);
    expect(ele.html()).toContain('Routes');

    // expect that the 2 links are visible
    expect(ele.find('ul').findAll('li').at(0).find('a')
      .isVisible()).toBe(true);
    expect(ele.find('ul').findAll('li').at(1).find('a')
      .isVisible()).toBe(true);
  });

  it('should have a populated top-right slot', () => {
    const ele = wrapper.find('[data-testid="top-right-section"]');

    expect(ele.exists()).toBe(true);
    expect(ele.html()).toContain('20 days ago');
  });

  it('should have a populated resourcesCount slot', () => {
    const ele = wrapper.find('[data-testid="resourcesCount-section"]');

    expect(ele.exists()).toBe(true);
    expect(ele.html()).toContain('2 Services');
    expect(ele.html()).toContain('3 Configs');
    expect(ele.html()).toContain('4 Environment variables');
  });
});
