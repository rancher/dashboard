import { mount } from '@vue/test-utils';
import { Banner } from './index';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive'

describe('component: Banner', () => {
  it('should display text based on label', () => {
    const label = 'test';
    const wrapper = mount(
      Banner,
      {
        directives: {
         cleanHtmlDirective 
        },
        propsData: { label }
      });

    const element = wrapper.find('span').element;

    expect(element.textContent).toBe(label);
  });
});
