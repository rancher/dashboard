import { mount } from '@vue/test-utils';
import RcCounterBadge from './index';
import { Type } from '../types';

describe('component: RcCounterBadge', () => {
  const types: Type[] = ['active', 'inactive'];

  it.each(types)('should apply correct classes for type "%s"', (type) => {
    const wrapper = mount(RcCounterBadge, { props: { type, count: 1 } });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.classes()).toContain(type);
  });

  it('should apply the correct class for disabled', () => {
    const wrapper = mount(RcCounterBadge, {
      props: {
        type: 'active', disabled: true, count: 1
      }
    });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.classes()).toContain('disabled');
  });

  it('should show the correct count below 1000', () => {
    const count = 999;
    const wrapper = mount(RcCounterBadge, {
      props: {
        type: 'active', disabled: true, count
      }
    });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.text()).toBe(count.toString());
  });

  it('should show the correct count at or above 1000', () => {
    const count = 1000;
    const wrapper = mount(RcCounterBadge, {
      props: {
        type: 'active', disabled: true, count
      }
    });

    const shapeEl = wrapper.find('.rc-counter-badge');

    expect(shapeEl.text()).toBe('999+');
  });
});
