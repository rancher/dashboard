import { mount } from '@vue/test-utils';
import RcDrawerMessage from './RcDrawerMessage.vue';

describe('component: RcDrawerMessage', () => {
  it('should render its message', () => {
    const wrapper = mount(RcDrawerMessage, { slots: { default: 'Nothing to show' } });

    expect(wrapper.text()).toBe('Nothing to show');
  });

  it('should render the icon it is given, hidden from assistive technology', () => {
    const wrapper = mount(RcDrawerMessage, { props: { icon: 'icon-warning' } });
    const icon = wrapper.find('i');

    // Decorative: the message text carries the meaning, so a name here would
    // just be read out twice.
    expect(icon.classes()).toContain('icon-warning');
    expect(icon.attributes('aria-hidden')).toBe('true');
  });

  it('should render no icon when none is given', () => {
    const wrapper = mount(RcDrawerMessage, { slots: { default: 'Just words' } });

    expect(wrapper.find('i').exists()).toBe(false);
  });
});
