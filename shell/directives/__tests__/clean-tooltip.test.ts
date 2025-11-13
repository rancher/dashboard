import { Directive, DirectiveBinding, ObjectDirective } from 'vue';

// Mock dependencies must be declared before jest.mock calls
const mockCreateTooltip = jest.fn();
const mockDestroyTooltip = jest.fn();
const mockPurifyHTML = jest.fn((content) => (content && content.trim() ? `purified:${ content }` : ''));

jest.mock('floating-vue', () => ({
  createTooltip:  mockCreateTooltip,
  destroyTooltip: mockDestroyTooltip,
}));

jest.mock('@shell/plugins/clean-html', () => ({ purifyHTML: mockPurifyHTML }));

// A simple mock for the tooltip instance returned by createTooltip
const mockTooltipInstance = { show: jest.fn() };

// Define a more specific type for our mock element
interface TooltipHTMLElement extends HTMLElement {
  __tooltipValue__?: string;
  __tooltipPlacement__?: string;
  __tooltipPopperClass__?: string;
  __tooltipDelay__?: { show: number; hide: number };
}

describe('clean-tooltip.ts', () => {
  let el: TooltipHTMLElement;
  let cleanTooltipDirective: Directive;
  let onMouseEnter: (e: MouseEvent | FocusEvent) => void;
  let onMouseLeave: (e: MouseEvent | FocusEvent) => void;

  beforeEach(() => {
    // Reset mocks and isolate the module for each test to ensure a fresh state
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const module = require('../clean-tooltip');

      cleanTooltipDirective = module.default;
      onMouseEnter = module.onMouseEnter;
      onMouseLeave = module.onMouseLeave;
    });

    mockCreateTooltip.mockReturnValue(mockTooltipInstance);

    // Create a mock element
    el = document.createElement('div') as TooltipHTMLElement;
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
        } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);

        expect(el.classList.contains('has-clean-tooltip')).toBe(true);
        expect(el.__tooltipValue__).toBe('Test Tooltip');
        expect(el.__tooltipPlacement__).toBe('top');
        expect(el.__tooltipPopperClass__).toBe('');
        expect(el.__tooltipDelay__).toStrictEqual({ show: 250, hide: 100 });

        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseenter', onMouseEnter);
        expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', onMouseLeave);
        expect(addEventListenerSpy).toHaveBeenCalledWith('focus', onMouseEnter);
        expect(addEventListenerSpy).toHaveBeenCalledWith('blur', onMouseLeave);
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
        } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);

        expect(el.__tooltipValue__).toBe('Object Tooltip');
        expect(el.__tooltipPlacement__).toBe('right'); // Modifier should override
        expect(el.__tooltipPopperClass__).toBe('custom-class');
        expect(el.__tooltipDelay__).toStrictEqual({ show: 500, hide: 200 });
      });

      it('should not add has-clean-tooltip class if content is empty', () => {
        const binding = { value: '', modifiers: {} } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);
        expect(el.classList.contains('has-clean-tooltip')).toBe(false);
      });
    });

    describe('updated', () => {
      it('should update the stored tooltip options', () => {
        const initialBinding = { value: 'Initial', modifiers: {} } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).mounted(el, initialBinding, {} as any, {} as any);

        const updatedBinding = { value: 'Updated', modifiers: { bottom: true } } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).updated(el, updatedBinding, {} as any, {} as any);

        expect(el.__tooltipValue__).toBe('Updated');
        expect(el.__tooltipPlacement__).toBe('bottom');
      });

      it('should re-show the tooltip if it is currently active on the element', () => {
        const binding = { value: 'Test', modifiers: {} } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);

        const mouseEnterEvent = new MouseEvent('mouseenter');

        Object.defineProperty(mouseEnterEvent, 'currentTarget', { value: el });
        onMouseEnter(mouseEnterEvent);

        expect(mockCreateTooltip).toHaveBeenCalledTimes(1);
        expect(mockTooltipInstance.show).toHaveBeenCalledTimes(1);

        const updatedBinding = { value: 'Updated Content', modifiers: {} } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).updated(el, updatedBinding, {} as any, {} as any);

        expect(mockDestroyTooltip).toHaveBeenCalledTimes(1);
        expect(mockCreateTooltip).toHaveBeenCalledTimes(2);
        expect(mockTooltipInstance.show).toHaveBeenCalledTimes(2);
        expect(mockCreateTooltip).toHaveBeenCalledWith(el, expect.objectContaining({ content: 'purified:Updated Content' }));
      });
    });

    describe('unmounted', () => {
      it('should remove event listeners and class', () => {
        const removeEventListenerSpy = jest.spyOn(el, 'removeEventListener');
        const binding = { value: 'Test', modifiers: {} } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);
        el.classList.add('has-clean-tooltip');

        (cleanTooltipDirective as ObjectDirective).unmounted(el, binding, {} as any, {} as any);

        expect(el.classList.contains('has-clean-tooltip')).toBe(false);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseenter', onMouseEnter);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', onMouseLeave);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', onMouseEnter);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', onMouseLeave);
      });

      it('should hide the tooltip if it is active on the element', () => {
        const binding = { value: 'Test', modifiers: {} } as unknown as DirectiveBinding;

        (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);

        const mouseEnterEvent = new MouseEvent('mouseenter');

        Object.defineProperty(mouseEnterEvent, 'currentTarget', { value: el });
        onMouseEnter(mouseEnterEvent);

        expect(mockCreateTooltip).toHaveBeenCalledTimes(1);

        (cleanTooltipDirective as ObjectDirective).unmounted(el, binding, {} as any, {} as any);

        expect(mockDestroyTooltip).toHaveBeenCalledTimes(1);
        expect(mockDestroyTooltip).toHaveBeenCalledWith(el);
      });
    });
  });

  describe('event handlers', () => {
    beforeEach(() => {
      el.__tooltipValue__ = 'Handler Test';
      el.__tooltipPlacement__ = 'top';
      el.__tooltipPopperClass__ = 'handler-class';
      el.__tooltipDelay__ = { show: 1, hide: 1 };
    });

    it('onMouseEnter should show the tooltip', () => {
      const event = new MouseEvent('mouseenter');

      Object.defineProperty(event, 'currentTarget', { value: el });
      onMouseEnter(event);

      expect(mockCreateTooltip).toHaveBeenCalledTimes(1);
      expect(mockCreateTooltip).toHaveBeenCalledWith(el, {
        content:        'purified:Handler Test',
        placement:      'top',
        popperClass:    'handler-class',
        delay:          { show: 1, hide: 1 },
        disposeTimeout: 250,
      });
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
  });

  describe('singleton logic', () => {
    let el2: TooltipHTMLElement;

    beforeEach(() => {
      el2 = document.createElement('div') as TooltipHTMLElement;
      document.body.appendChild(el2);
    });

    afterEach(() => {
      if (document.body.contains(el2)) {
        document.body.removeChild(el2);
      }
    });

    it('should only allow one tooltip to be visible at a time', () => {
      const binding1 = { value: 'Tooltip 1', modifiers: {} } as unknown as DirectiveBinding;

      (cleanTooltipDirective as ObjectDirective).mounted(el, binding1, {} as any, {} as any);

      const binding2 = { value: 'Tooltip 2', modifiers: {} } as unknown as DirectiveBinding;

      (cleanTooltipDirective as ObjectDirective).mounted(el2, binding2, {} as any, {} as any);

      const enterEvent1 = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent1, 'currentTarget', { value: el });
      onMouseEnter(enterEvent1);

      expect(mockCreateTooltip).toHaveBeenCalledTimes(1);
      expect(mockCreateTooltip).toHaveBeenCalledWith(el, expect.any(Object));
      expect(mockTooltipInstance.show).toHaveBeenCalledTimes(1);

      const enterEvent2 = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent2, 'currentTarget', { value: el2 });
      onMouseEnter(enterEvent2);

      expect(mockDestroyTooltip).toHaveBeenCalledTimes(1);
      expect(mockDestroyTooltip).toHaveBeenCalledWith(el);
      expect(mockCreateTooltip).toHaveBeenCalledTimes(2);
      expect(mockCreateTooltip).toHaveBeenCalledWith(el2, expect.any(Object));
      expect(mockTooltipInstance.show).toHaveBeenCalledTimes(2);
    });

    it('should not show tooltip for empty or whitespace-only content', () => {
      const binding = { value: '  ', modifiers: {} } as unknown as DirectiveBinding;

      (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);

      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      expect(mockCreateTooltip).not.toHaveBeenCalled();
    });
  });

  describe('purifyContent', () => {
    it('should purify string content', () => {
      const binding = { value: '<h1>Hello</h1>', modifiers: {} } as unknown as DirectiveBinding;

      (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);

      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      expect(mockPurifyHTML).toHaveBeenCalledWith('<h1>Hello</h1>');
      expect(mockCreateTooltip).toHaveBeenCalledWith(el, expect.objectContaining({ content: 'purified:<h1>Hello</h1>' }));
    });

    it('should purify content within an object value', () => {
      const binding = { value: { content: '<p>World</p>' }, modifiers: {} } as unknown as DirectiveBinding;

      (cleanTooltipDirective as ObjectDirective).mounted(el, binding, {} as any, {} as any);

      const enterEvent = new MouseEvent('mouseenter');

      Object.defineProperty(enterEvent, 'currentTarget', { value: el });
      onMouseEnter(enterEvent);

      expect(mockPurifyHTML).toHaveBeenCalledWith('<p>World</p>');
      expect(mockCreateTooltip).toHaveBeenCalledWith(el, expect.objectContaining({ content: 'purified:<p>World</p>' }));
    });
  });
});
