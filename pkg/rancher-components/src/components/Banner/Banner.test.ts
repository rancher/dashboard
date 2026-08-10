import { mount } from '@vue/test-utils';
import { Banner } from './index';

describe('component: Banner', () => {
  it('should display text based on label', () => {
    const label = 'some-label-test';
    const wrapper = mount(
      Banner,
      { props: { label } });

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
    const wrapper = mount(Banner, { props: { icon } });

    const element = wrapper.find(`.${ icon }`).element;

    expect(element.classList).toContain(icon);
  });

  it('should not display an icon', () => {
    const wrapper = mount(Banner);

    const iconElement = wrapper.find('[data-testid="banner-icon"]');

    expect(iconElement.exists()).toBe(false);
  });

  it('should emit close event', () => {
    const wrapper = mount(Banner, { props: { closable: true } });
    const element = wrapper.find(`[data-testid="banner-close"]`).element as HTMLElement;

    element.click();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should add the right color', () => {
    const color = 'red';
    const wrapper = mount(Banner, { props: { color } });

    const element = wrapper.element;

    expect(element.classList).toContain(color);
  });

  it('should stack the banner messages', () => {
    const stacked = true;
    const wrapper = mount(Banner, { props: { stacked } });

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
        props: {
          label, icon, closable
        }
      });

    const mainContainer = wrapper.find('.banner');
    const bannerIcon = wrapper.find('.banner__icon i');
    const bannerCloseBtn = wrapper.find('.banner__content__closer');
    const bannerCloseIcon = wrapper.find('.icon-close.closer-icon');

    const bannerIconAlt = bannerIcon.attributes('alt');

    const bannerCloseBtnRole = bannerCloseBtn.attributes('role');
    const bannerCloseBtnAriaLabel = bannerCloseBtn.attributes('aria-label');

    const bannerCloseIconAlt = bannerCloseIcon.attributes('alt');

    expect(mainContainer.attributes('role')).toBeUndefined();
    expect(mainContainer.attributes('aria-labelledby')).toBeUndefined();
    expect(bannerIconAlt).toBeDefined();
    expect(bannerCloseIconAlt).toBeDefined();
    expect(bannerCloseBtnRole).toBe('button');
    expect(bannerCloseBtnAriaLabel).toBeDefined();
  });

  describe('a11y: role prop (live region)', () => {
    it('should have no role attribute by default', () => {
      const wrapper = mount(Banner, { props: { label: 'test' } });
      const mainContainer = wrapper.find('.banner');

      expect(mainContainer.attributes('role')).toBeUndefined();
    });

    it('should render role="alert" for persistent live-region containers announcing errors', () => {
      const wrapper = mount(Banner, { props: { label: 'Something went wrong', role: 'alert' } });
      const mainContainer = wrapper.find('.banner');

      expect(mainContainer.attributes('role')).toBe('alert');
    });

    it('should render role="status" for persistent live-region containers announcing polite notifications', () => {
      const wrapper = mount(Banner, { props: { label: 'Cluster is provisioning', role: 'status' } });
      const mainContainer = wrapper.find('.banner');

      expect(mainContainer.attributes('role')).toBe('status');
    });

    it('should accept only "alert" and "status" as valid role values', () => {
      const alertWrapper = mount(Banner, { props: { label: 'test', role: 'alert' } });
      const statusWrapper = mount(Banner, { props: { label: 'test', role: 'status' } });

      expect(alertWrapper.find('.banner').attributes('role')).toBe('alert');
      expect(statusWrapper.find('.banner').attributes('role')).toBe('status');
    });
  });
});
