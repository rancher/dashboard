import { DirectiveBinding, Directive } from 'vue';
import { destroyTooltip, createTooltip } from 'floating-vue';
import { purifyHTML } from '@shell/plugins/clean-html';

// This is a singleton tooltip implementation.
// It ensures that only one tooltip is active at a time, preventing multiple tooltips from appearing simultaneously.
// This improves performance and user experience.
let singleton: any = null;
let currentTarget: HTMLElement | null = null;

interface TooltipDelay {
  show: number;
  hide: number;
}

interface TooltipHTMLElement extends HTMLElement {
  __tooltipValue__: string;
  __tooltipPlacement__: string;
  __tooltipPopperClass__: string;
  __tooltipDelay__: TooltipDelay;
  __tooltipTriggers__: string[];
}

interface TooltipOptions {
  content: string;
  placement: string;
  popperClass: string;
  delay: TooltipDelay;
  triggers: string[];
}

/**
 * Shows a singleton tooltip for the given target element.
 * If a tooltip is already active, it is hidden before showing the new one.
 * @param {HTMLElement} target The element to which the tooltip is attached.
 * @param {string|object} rawValue The content of the tooltip.
 * @param {string} placement The placement of the tooltip.
 * @param {string} popperClass Custom CSS class for the popper.
 * @param {object} delay The delay for showing and hiding the tooltip.
 */
function showSingletonTooltip(target: HTMLElement, rawValue: string | { content: string }, placement: string, popperClass: string, delay: TooltipDelay) {
  // If a tooltip is already active, it should be hidden before showing the new one.
  if (singleton) {
    destroyTooltip(currentTarget);
    singleton = null;
  }

  const content = purifyContent(rawValue);

  // Don't show the tooltip if the content is empty.
  const finalContent =
    typeof content === 'object' && content.content ? content.content.trim() : typeof content === 'string' ? content.trim() : '';

  if (!finalContent) {
    return;
  }
  // Create a new tooltip instance.
  singleton = createTooltip(target, {
    content,
    placement,
    popperClass,
    delay
  });

  singleton.show();
  currentTarget = target;
}

/**
 * Hides the singleton tooltip if it is currently shown for the given target element.
 * @param {HTMLElement} target The element from which the tooltip should be hidden.
 */
function hideSingletonTooltip(target: HTMLElement) {
  if (!singleton) {
    return;
  }

  if (currentTarget === target) {
    destroyTooltip(target);
    singleton = null;
    currentTarget = null;
  }
}

/**
 * Purifies the HTML content of the tooltip to prevent XSS attacks.
 * @param {string|object} value The content to be purified.
 * @returns {string|object} The purified content.
 */
function purifyContent(value: string | { content: string }): string | { content: string } {
  if (typeof value === 'string') {
    return purifyHTML(value);
  } else if (
    value &&
    typeof value === 'object' &&
    typeof value.content === 'string'
  ) {
    return { ...(value as object), content: purifyHTML(value.content) };
  } else {
    return value;
  }
}

/**
 * A Vue directive that provides a clean singleton tooltip using floating-vue.
 */
const cleanTooltipDirective: Directive = {
  /**
   * Called when the directive is mounted to an element.
   * It sets up the tooltip options and adds event listeners.
   * @param {HTMLElement} el The element the directive is bound to.
   * @param {object} binding The directive binding object.
   */
  mounted(el: TooltipHTMLElement, binding: DirectiveBinding) {
    const { value, modifiers } = binding;
    const {
      content, placement, popperClass, delay, triggers
    } = getTooltipOptions(value, modifiers);

    // Store the tooltip options on the element for later use.
    el.__tooltipValue__ = content;
    el.__tooltipPlacement__ = placement;
    el.__tooltipPopperClass__ = popperClass;
    el.__tooltipDelay__ = delay;
    el.__tooltipTriggers__ = triggers;

    if (triggers.includes('hover')) {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    }
    if (triggers.includes('focus')) {
      el.addEventListener('focus', onMouseEnter);
      el.addEventListener('blur', onMouseLeave);
    }
    if (triggers.includes('click')) {
      el.addEventListener('click', onMouseClick);
    }

    if (content) {
      // Add a class to the element to indicate that it has a clean tooltip.
      el.classList.add('has-clean-tooltip');
    }
  },
  /**
   * Called when the directive's binding value is updated.
   * It updates the tooltip options and shows the tooltip if it is already active.
   * @param {HTMLElement} el The element the directive is bound to.
   * @param {object} binding The directive binding object.
   */
  updated(el: TooltipHTMLElement, binding: DirectiveBinding) {
    const { value, modifiers } = binding;
    const {
      content, placement, popperClass, delay, triggers
    } = getTooltipOptions(value, modifiers);

    // Update stored content and options
    el.__tooltipValue__ = content;
    el.__tooltipPlacement__ = placement;
    el.__tooltipPopperClass__ = popperClass;
    el.__tooltipDelay__ = delay;
    el.__tooltipTriggers__ = triggers;

    // If this element's tooltip is currently shown, update it
    if (currentTarget === el) {
      showSingletonTooltip(el, content, placement, popperClass, delay);
    }
  },
  /**
   * Called when the directive is unmounted from an element.
   * It removes the event listeners and hides the tooltip if it is active.
   * @param {HTMLElement} el The element the directive is bound to.
   */
  unmounted(el: TooltipHTMLElement) {
    el.removeEventListener('mouseenter', onMouseEnter);
    el.removeEventListener('mouseleave', onMouseLeave);
    el.removeEventListener('focus', onMouseEnter);
    el.removeEventListener('blur', onMouseLeave);
    el.removeEventListener('click', onMouseClick);
    el.classList.remove('has-clean-tooltip');

    // If this element's tooltip is currently shown, hide it
    if (currentTarget === el) {
      hideSingletonTooltip(el);
    }
  },
};

/**
 * Event handler for mouseenter and focus events.
 * @param {Event} e The event object.
 */
function onMouseEnter(e: MouseEvent | FocusEvent) {
  const el = e.currentTarget as TooltipHTMLElement;

  showSingletonTooltip(el, el.__tooltipValue__, el.__tooltipPlacement__, el.__tooltipPopperClass__, el.__tooltipDelay__);
}

/**
 * Event handler for mouseleave and blur events.
 * @param {Event} e The event object.
 */
function onMouseLeave(e: MouseEvent | FocusEvent) {
  const el = e.currentTarget as TooltipHTMLElement;

  hideSingletonTooltip(el);
}

/**
 * Event handler for click events.
 * @param {Event} e The event object.
 */
function onMouseClick(e: MouseEvent) {
  const el = e.currentTarget as TooltipHTMLElement;

  if (currentTarget === el) {
    hideSingletonTooltip(el);
  } else {
    showSingletonTooltip(el, el.__tooltipValue__, el.__tooltipPlacement__, el.__tooltipPopperClass__, el.__tooltipDelay__);
  }
}

/**
 * Parses the tooltip options from the directive's value and modifiers.
 * @param {string|object} value The value of the directive.
 * @param {object} modifiers The modifiers of the directive.
 * @returns {object} The parsed tooltip options.
 */
function getTooltipOptions(value: string | { content?: string, placement?: string, popperClass?: string, delay?: TooltipDelay, triggers?: string[] }, modifiers: Partial<Record<string, boolean>>): TooltipOptions {
  let content = '';
  let placement = 'top';
  let popperClass = '';
  let delay: TooltipDelay = { show: 250, hide: 100 };
  let triggers: string[];

  if (typeof value === 'string') {
    content = value;
    triggers = ['hover'];
  } else if (value && typeof value === 'object') {
    content = value.content || '';
    placement = value.placement || 'top';
    popperClass = value.popperClass || '';
    delay = value.delay || { show: 250, hide: 100 };
    triggers = value.triggers || ['hover'];
  } else {
    triggers = ['hover'];
  }

  // Modifiers can also specify placement (e.g., v-clean-tooltip.bottom)
  if (modifiers.top) {
    placement = 'top';
  } else if (modifiers.bottom) {
    placement = 'bottom';
  } else if (modifiers.left) {
    placement = 'left';
  } else if (modifiers.right) {
    placement = 'right';
  }

  return {
    content, placement, popperClass, delay, triggers
  };
}

export default cleanTooltipDirective;

// Exporting for unit testing purposes
export {
  onMouseEnter,
  onMouseLeave,
  onMouseClick
};
