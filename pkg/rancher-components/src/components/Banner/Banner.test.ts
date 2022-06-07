import { mount } from '@vue/test-utils';
import { Banner } from './index';

describe('component: Banner', () => {
  it('should display text based on label', () => {
    const label = 'test';
    const wrapper = mount(Banner, { propsData: { label } });

    const element = wrapper.find('span').element;

    expect(element.textContent).toBe(label);
  });
});
