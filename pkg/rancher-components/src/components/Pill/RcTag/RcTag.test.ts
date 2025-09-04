import { mount } from '@vue/test-utils';
import RcTag from './index';
import { Type } from './types';

describe('component: RcTag', () => {
  const types: Type[] = ['active', 'inactive'];

  it.each(types)('should apply correct classes for type "%s"', (type) => {
    const wrapper = mount(RcTag, { props: { type } });

    const shapeEl = wrapper.find('.rc-tag');

    expect(shapeEl.classes()).toContain(type);
  });

  it('should apply the correct class for disabled', () => {
    const wrapper = mount(RcTag, { props: { type: 'active', disabled: true } });

    const shapeEl = wrapper.find('.rc-tag');

    expect(shapeEl.classes()).toContain('disabled');
  });

  it('should show the close button if showClose is true', () => {
    const wrapper = mount(RcTag, {
      props: {
        type: 'active', disabled: true, showClose: true
      }
    });

    const shapeEl = wrapper.find('.rc-tag');

    expect(shapeEl.find('.icon-close').exists()).toBeTruthy();
  });

  it('should emit close event when close button is clicked', () => {
    const wrapper = mount(RcTag, {
      props: {
        type: 'active', disabled: true, showClose: true
      }
    });

    const shapeEl = wrapper.find('.rc-tag');
    const close = shapeEl.find('button');

    close.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should add the aria-label to the button when specified', () => {
    const closeAria = 'CLOSE_ARIA';
    const wrapper = mount(RcTag, {
      props: {
        type: 'active', disabled: true, showClose: true, closeAriaLabel: closeAria
      }
    });

    const shapeEl = wrapper.find('.rc-tag');
    const close = shapeEl.find('button');

    expect(close.attributes('aria-label')).toBe(closeAria);
  });
});
