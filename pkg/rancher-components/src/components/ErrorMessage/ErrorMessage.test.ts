import { mount } from '@vue/test-utils';
import { ErrorMessage } from './index';

describe('component: ErrorMessage', () => {
  it('empty test', () => {
    expect(true).toBe(true);
  });

  // it('should display an icon', () => {
  //   const icon = 'my-icon';
  //   const wrapper = mount(Banner, { propsData: { icon } });

  //   const element = wrapper.find(`.${ icon }`).element;

  //   expect(element.classList).toContain(icon);
  // });

  // it('should not display an icon', () => {
  //   const wrapper = mount(Banner);

  //   const element = wrapper.find(`[data-testid="banner-icon"]`).element;

  //   expect(element).not.toBeDefined();
  // });

  // it('should emit close event', () => {
  //   const wrapper = mount(Banner, { propsData: { closable: true } });
  //   const element = wrapper.find(`[data-testid="banner-close"]`).element;

  //   element.click();

  //   expect(wrapper.emitted('close')).toHaveLength(1);
  // });

  // it('should add the right color', () => {
  //   const color = 'red';
  //   const wrapper = mount(Banner, { propsData: { color } });

  //   const element = wrapper.element;

  //   expect(element.classList).toContain(color);
  // });

  // it('should stack the banner messages', () => {
  //   const stacked = true;
  //   const wrapper = mount(Banner, { propsData: { stacked } });

  //   const element = wrapper.find(`[data-testid="banner-content"]`).element;

  //   expect(element.classList).toContain('stacked');
  // });
});
