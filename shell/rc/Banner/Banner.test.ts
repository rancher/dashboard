import { mount } from '@vue/test-utils';
import { Banner } from './index';

describe('component: Banner', () => {
  it('should display text based on label', () => {
    const label = 'some-label-test';
    const wrapper = mount(
      Banner,
      { propsData: { label } });

    expect(wrapper.html()).toContain(label);
  });

  it('should display text based on default slot', () => {
    const slotText = 'some-test';

    const wrapper = mount(
      Banner,
      { slots: { default: slotText } }
    );

    expect(wrapper.html()).toContain(slotText);
  });

  it('should display an icon', () => {
    const icon = 'my-icon';
    const wrapper = mount(Banner, { propsData: { icon } });

    const element = wrapper.find(`.${ icon }`).element;

    expect(element.classList).toContain(icon);
  });

  it('should not display an icon', () => {
    const wrapper = mount(Banner);

    const iconElement = wrapper.find('[data-testid="banner-icon"]');

    expect(iconElement.exists()).toBe(false);
  });

  it('should emit close event', () => {
    const wrapper = mount(Banner, { propsData: { closable: true } });
    const element = wrapper.find(`[data-testid="banner-close"]`).element;

    element.click();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should add the right color', () => {
    const color = 'red';
    const wrapper = mount(Banner, { propsData: { color } });

    const element = wrapper.element;

    expect(element.classList).toContain(color);
  });

  it('should stack the banner messages', () => {
    const stacked = true;
    const wrapper = mount(Banner, { propsData: { stacked } });

    const element = wrapper.find(`[data-testid="banner-content"]`).element;

    expect(element.classList).toContain('stacked');
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', () => {
    const label = 'test';
    const icon = 'my-icon';
    const closable = true;

    const wrapper = mount(
      Banner,
      {
        propsData: {
          label, icon, closable
        }
      });

    const mainContainer = wrapper.find('.banner');
    const bannerIcon = wrapper.find('.banner__icon i');
    const bannerContent = wrapper.find('.banner__content');
    const bannerCloseBtn = wrapper.find('.banner__content__closer');
    const bannerCloseIcon = wrapper.find('.icon-close.closer-icon');

    const mainContainerRole = mainContainer.attributes('role');
    const mainContainerAriaLabelledBy = mainContainer.attributes('aria-labelledby');

    const bannerIconAlt = bannerIcon.attributes('alt');

    const bannerContentId = bannerContent.attributes('id');

    const bannerCloseBtnRole = bannerCloseBtn.attributes('role');
    const bannerCloseBtnAriaLabel = bannerCloseBtn.attributes('aria-label');

    const bannerCloseIconAlt = bannerCloseIcon.attributes('alt');

    expect(mainContainerRole).toBe('region');
    expect(mainContainerAriaLabelledBy).toBe(bannerContentId);
    expect(bannerIconAlt).toBeDefined();
    expect(bannerCloseIconAlt).toBeDefined();
    expect(bannerCloseBtnRole).toBe('button');
    expect(bannerCloseBtnAriaLabel).toBeDefined();
  });
});
