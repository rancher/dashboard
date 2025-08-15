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
});
