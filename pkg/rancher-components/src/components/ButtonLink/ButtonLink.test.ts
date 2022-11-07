import { mount } from '@vue/test-utils';
import { ButtonLink } from './index';

describe('component: ButtonLink', () => {
  it('should display text based on label', () => {
    const label = 'test';
    const wrapper = mount(ButtonLink, { propsData: { label } });

    const element = wrapper.find('span').element;

    expect(element.textContent).toBe(label);
  });
});
