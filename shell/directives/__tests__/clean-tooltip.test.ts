const mockCreateTooltip = jest.fn();
const mockDestroyTooltip = jest.fn();
const mockPurifyHTML = jest.fn((content) => (content || '').trim());

jest.mock('floating-vue', () => ({
  createTooltip:  mockCreateTooltip,
  destroyTooltip: mockDestroyTooltip,
}));

jest.mock('@shell/plugins/clean-html', () => ({ purifyHTML: mockPurifyHTML }));

// A simple mock for the tooltip instance returned by createTooltip
const mockTooltipInstance = { show: jest.fn() };

describe('clean-tooltip.ts', () => {
  let el: any;
  let cleanTooltipDirective: any;
  let onMouseEnter: (e: MouseEvent | FocusEvent) => void;
  let onMouseLeave: (e: MouseEvent | FocusEvent) => void;
  let onMouseClick: (e: MouseEvent) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const module = require('../clean-tooltip');

      cleanTooltipDirective = module.default;
      onMouseEnter = module.onMouseEnter;
      onMouseLeave = module.onMouseLeave;
      onMouseClick = module.onMouseClick;
    });

    mockCreateTooltip.mockReturnValue(mockTooltipInstance);

    el = document.createElement('div');
    document.body.appendChild(el);
  });

  afterEach(() => {
    if (document.body.contains(el)) {
      document.body.removeChild(el);
    }
  });

  describe('directive: cleanTooltipDirective', () => {
    describe('mounted', () => {
      it('should add event listeners and set initial properties for string value', () => {
        const addEventListenerSpy = jest.spyOn(el, 'addEventListener');
        const binding = {
          value:     'Test Tooltip',
          modifiers: {},
        };

        cleanTooltipDirective.mounted(el, binding);

        expect(el.classList.contains('has-clean-tooltip')).toBe(true);
        expect(el.__tooltipOptions__).toStrictEqual({ content: 'Test Tooltip' });

        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseenter', onMouseEnter);
        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', onMouseLeave);
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('focus', onMouseEnter);
        expect(addEventListenerSpy).not.toHaveBeenCalledWith('blur', onMouseLeave);
      });

      it('should parse object value and modifiers correctly', () => {
        const binding = {
          value: {
            content:     'Object Tooltip',
            placement:   'bottom',
            popperClass: 'custom-class',
            delay:       { show: 500, hide: 200 },
          },
          modifiers: { right: true },
        };

        cleanTooltipDirective.mounted(el, binding);

        expect(el.__tooltipOptions__).toStrictEqual({
          content:     'Object Tooltip',
          placement:   'right', // Modifier should override
          popperClass: 'custom-class',
          delay:       { show: 500, hide: 200 },
        });
      });

      it('should not add has-clean-tooltip class if content is empty', () => {
        const binding = { value: '', modifiers: {} };

        cleanTooltipDirective.mounted(el, binding);
        expect(el.classList.contains('has-clean-tooltip')).toBe(false);
      });
    });

    describe('updated', () => {
      it('should update the stored tooltip options', () => {
        const initialBinding = { value: 'Initial', modifiers: {} };

        cleanTooltipDirective.mounted(el, initialBinding);

        const updatedBinding = { value: 'Updated', modifiers: { bottom: true } };

        cleanTooltipDirective.updated(el, updatedBinding);

        expect(el.__tooltipOptions__).toStrictEqual({ content: 'Updated', placement: 'bottom' });
      });

      it('should re-show the tooltip if it is currently active on the element', () => {
        const binding = { value: { content: 'Test' }, modifiers: {} };

        cleanTooltipDirective.mounted(el, binding);

        const mouseEnterEvent = new MouseEvent('mouseenter');

        Object.defineProperty(mouseEnterEvent, 'currentTarget', { value: el });
        onMouseEnter(mouseEnterEvent);

        expect(mockCreateTooltip).toHaveBeenCalledTimes(1);
        expect(mockTooltipInstance.show).toHaveBeenCalledTimes(1);

        const updatedBinding = { value: { content: 'Updated Content' }, modifiers: {} };

        cleanTooltipDirective.updated(el, updatedBinding);

        expect(mockDestroyTooltip).toHaveBeenCalledTimes(1);
        expect(mockCreateTooltip).toHaveBeenCalledTimes(2);
        expect(mockTooltipInstance.show).toHaveBeenCalledTimes(2);
        expect(mockCreateTooltip).toHaveBeenCalledWith(el, expect.objectContaining({ content: 'Updated Content' }), {});
      });
    });

    describe('unmounted', () => {
      it('should remove event listeners and class', () => {
        const removeEventListenerSpy = jest.spyOn(el, 'removeEventListener');
        const binding = { value: 'Test', modifiers: {} };

        cleanTooltipDirective.mounted(el, binding);
        el.classList.add('has-clean-tooltip');

        cleanTooltipDirective.unmounted(el, binding);

        expect(el.classList.contains('has-clean-tooltip')).toBe(false);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseenter', onMouseEnter);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', onMouseLeave);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', onMouseEnter);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', onMouseLeave);
      });

      it('should hide the tooltip if it is active on the element', () => {
        const binding = { value: { content: 'Test' }, modifiers: {} };

        cleanTooltipDirective.mounted(el, binding);

        const mouseEnterEvent = new MouseEvent('mouseenter');

        Object.defineProperty(mouseEnterEvent, 'currentTarget', { value: el });
        onMouseEnter(mouseEnterEvent);

        expect(mockCreateTooltip).toHaveBeenCalledTimes(1);

        cleanTooltipDirective.unmounted(el, binding);

        expect(mockDestroyTooltip).toHaveBeenCalledTimes(1);
        expect(mockDestroyTooltip).toHaveBeenCalledWith(el);
      });
    });
  });

  describe('event handlers', () => {
    beforeEach(() => {
      el.__tooltipOptions__ = {
        content: 'Handler Test',
        delay:   { show: 1, hide: 1 },
      };
    });

    it('onMouseEnter should show the tooltip', () => {
      const event = new MouseEvent('mouseenter');

      Object.defineProperty(event, 'currentTarget', { value: el });
      onMouseEnter(event);

      expect(mockCreateTooltip).toHaveBeenCalledTimes(1);
      expect(mockCreateTooltip).toHaveBeenCalledWith(el, {
        content: 'Handler Test',
        delay:   { show: 1, hide: 1 },
      }, {});
      expect(mockTooltipInstance.show).toHaveBeenCalledTimes(1);
    });

    it('onMouseLeave should hide the tooltip', () => {
      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      const leaveEvent = new MouseEvent('mouseleave');

      Object.defineProperty(leaveEvent, 'currentTarget', { value: el });
      onMouseLeave(leaveEvent);

      expect(mockDestroyTooltip).toHaveBeenCalledTimes(1);
      expect(mockDestroyTooltip).toHaveBeenCalledWith(el);
    });

    it('onMouseClick should toggle the tooltip', () => {
      const event = new MouseEvent('click');

      el.__tooltipOptions__.triggers = ['click'];
      Object.defineProperty(event, 'currentTarget', { value: el });

      // First click shows tooltip
      onMouseClick(event);
      expect(mockCreateTooltip).toHaveBeenCalledTimes(1);
      expect(mockTooltipInstance.show).toHaveBeenCalledTimes(1);

      // To simulate it's open, we need to set the internal currentTarget.
      // We can do this by calling onMouseEnter.
      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      // onMouseEnter destroys the previous tooltip and creates a new one.
      expect(mockDestroyTooltip).toHaveBeenCalledTimes(1);
      expect(mockCreateTooltip).toHaveBeenCalledTimes(2);

      // Now that the tooltip for `el` is considered active, a click should hide it.
      onMouseClick(event);

      expect(mockDestroyTooltip).toHaveBeenCalledTimes(2);
      expect(mockDestroyTooltip).toHaveBeenLastCalledWith(el);
    });
  });

  describe('content', () => {
    it('should not show tooltip for empty content', () => {
      const binding = { value: '  ', modifiers: {} };

      cleanTooltipDirective.mounted(el, binding);

      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      expect(mockCreateTooltip).not.toHaveBeenCalled();
    });

    it('should purify string content', () => {
      const binding = { value: '<h1>Hello</h1>', modifiers: {} };

      cleanTooltipDirective.mounted(el, binding);

      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      expect(mockPurifyHTML).toHaveBeenCalledWith('<h1>Hello</h1>');
      expect(mockCreateTooltip).toHaveBeenCalledWith(el, expect.objectContaining({ content: '<h1>Hello</h1>' }), {});
    });

    it('should purify content within an object value', () => {
      const binding = { value: { content: '<p>World</p>' }, modifiers: {} };

      cleanTooltipDirective.mounted(el, binding);

      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      expect(mockPurifyHTML).toHaveBeenCalledWith('<p>World</p>');
      expect(mockCreateTooltip).toHaveBeenCalledWith(el, expect.objectContaining({ content: '<p>World</p>' }), {});
    });
  });

  describe('triggers', () => {
    it('should only add click listeners if triggers: [\'click\'] is provided', () => {
      const addEventListenerSpy = jest.spyOn(el, 'addEventListener');
      const binding = {
        value: {
          content:  'Click Tooltip',
          triggers: ['click'],
        },
        modifiers: {},
      };

      cleanTooltipDirective.mounted(el, binding);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('mouseenter', onMouseEnter);
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('mouseleave', onMouseLeave);
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('focus', onMouseEnter);
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('blur', onMouseLeave);
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', onMouseClick);
    });
  });
});
