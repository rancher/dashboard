import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentOptions } from 'vue';
import cleanTooltipDirective, { onMouseEnter, onMouseLeave } from '@shell/directives/clean-tooltip';

const mockTooltip = { show: jest.fn(), hide: jest.fn() };

jest.mock('floating-vue', () => ({ createTooltip: jest.fn(() => mockTooltip) }));
jest.mock('@shell/plugins/clean-html', () => ({ purifyHTML: jest.fn((val) => val) }));

describe('clean-tooltip directive', () => {
  let wrapper: VueWrapper<any>;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  const TestComponent: ComponentOptions = {
    template:   '<div v-clean-tooltip="tooltipContent"></div>',
    directives: { cleanTooltip: cleanTooltipDirective },
    props:      { tooltipContent: { default: 'Test Tooltip' } }
  };

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener');
  });

  afterEach(() => {
    wrapper?.unmount();
    jest.clearAllMocks();

    addEventListenerSpy?.mockRestore();
    removeEventListenerSpy?.mockRestore();
  });

  it('should add event listeners and class on mount', () => {
    wrapper = mount(TestComponent);

    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseenter', onMouseEnter);
    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', onMouseLeave);
    expect(addEventListenerSpy).toHaveBeenCalledWith('focus', onMouseEnter);
    expect(addEventListenerSpy).toHaveBeenCalledWith('blur', onMouseLeave);
    expect(wrapper.classes()).toContain('has-clean-tooltip');
  });

  it('should show tooltip on mouseenter', async() => {
    wrapper = mount(TestComponent);

    await wrapper.trigger('mouseenter');

    expect(require('floating-vue').createTooltip).toHaveBeenCalledWith(
      wrapper.element,
      {
        disposeTimeout: 250,
        content:        'Test Tooltip',
        placement:      'top',
        popperClass:    '',
        delay:          { show: 250, hide: 100 }
      }
    );
    expect(mockTooltip.show).toHaveBeenCalledTimes(1);
  });

  it('should hide tooltip on mouseleave', async() => {
    wrapper = mount(TestComponent);

    await wrapper.trigger('mouseenter');
    await wrapper.trigger('mouseleave');

    expect(mockTooltip.hide).toHaveBeenCalledTimes(1);
  });

  it('should remove event listeners and class on unmount', () => {
    wrapper = mount(TestComponent);
    wrapper.unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseenter', onMouseEnter);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', onMouseLeave);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', onMouseEnter);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', onMouseLeave);
    expect(wrapper.classes()).not.toContain('has-clean-tooltip');
  });

  it('should update tooltip content when binding value changes', async() => {
    wrapper = mount(TestComponent);

    await wrapper.setProps({ tooltipContent: 'New Tooltip Content' });
    await wrapper.trigger('mouseenter');

    expect(require('floating-vue').createTooltip).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ content: 'New Tooltip Content' })
    );
  });

  it('should not show tooltip if content is empty', async() => {
    wrapper = mount(TestComponent, { props: { tooltipContent: '' } });

    await wrapper.trigger('mouseenter');

    expect(require('floating-vue').createTooltip).not.toHaveBeenCalled();
  });
});
