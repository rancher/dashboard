import { DirectiveBinding, Directive } from 'vue';
import { destroyTooltip, createTooltip } from 'floating-vue';
import { purifyHTML } from '@shell/plugins/clean-html';

// This is a singleton tooltip implementation that improves performance on pages with many tooltips.
// Instead of instantiating a Vue component for every tooltip on the page, this directive attaches lightweight event listeners.
// It then imperatively creates and destroys a single tooltip instance as needed, avoiding the high upfront memory and processing cost of many Vue components.
let singleton: ReturnType<typeof createTooltip> | null = null;
let currentTarget: HTMLElement | null = null;

interface TooltipDelay {
  show: number;
  hide: number;
}

// Options are optional, to be handled by floating-vue's defaults
interface TooltipOptions {
  content?: string;
  placement?: string;
  popperClass?: string;
  delay?: TooltipDelay;
  triggers?: string[];
}

interface TooltipHTMLElement extends HTMLElement {
  // Store the whole options object for the tooltip
  __tooltipOptions__: TooltipOptions;
}

/**
 * Shows a singleton tooltip for the given target element.
 * If a tooltip is already active, it is hidden before showing the new one.
 * @param {HTMLElement} target The element to which the tooltip is attached.
 * @param {TooltipOptions} options The options for the tooltip.
 */
function showSingletonTooltip(target: HTMLElement, options: TooltipOptions) {
  // If a tooltip is already active, it should be hidden before showing the new one.
  if (singleton) {
    destroyTooltip(currentTarget);
    singleton = null;
  }

  const purifiedContent = options.content ? purifyContent(options.content) : '';

  // Don't show the tooltip if the content is empty.
  if (!purifiedContent) {
    return;
  }

  const tooltipConfig = {
    ...options,
    content: purifiedContent,
  };

  // Create a new tooltip instance.
  singleton = createTooltip(target, tooltipConfig, {});

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
 * Purifies and trims the HTML content of the tooltip to prevent XSS attacks.
 * @param {string} rawValue The raw content string to be purified and trimmed.
 * @returns {string} The purified and trimmed content string.
 */
function purifyContent(rawValue: string): string {
  const purified = purifyHTML(rawValue);

  return purified.trim();
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
    el.__tooltipOptions__ = getTooltipOptions(binding.value, binding.modifiers);

    const triggers = el.__tooltipOptions__.triggers || ['hover'];

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

    if (el.__tooltipOptions__.content) {
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
    el.__tooltipOptions__ = getTooltipOptions(binding.value, binding.modifiers);

    // doing this here too because the tooltip content may change after mount.
    if (el.__tooltipOptions__.content) {
      el.classList.add('has-clean-tooltip');
    } else {
      el.classList.remove('has-clean-tooltip');
    }

    // If this element's tooltip is currently shown, update it
    if (currentTarget === el) {
      showSingletonTooltip(el, el.__tooltipOptions__);
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

  showSingletonTooltip(el, el.__tooltipOptions__);
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
    showSingletonTooltip(el, el.__tooltipOptions__);
  }
}

/**
 * Parses the tooltip options from the directive's value and modifiers.
 * @param {string|object} value The value of the directive.
 * @param {object} modifiers The modifiers of the directive.
 * @returns {object} The parsed tooltip options.
 */
function getTooltipOptions(value: string | TooltipOptions, modifiers: Partial<Record<string, boolean>>): TooltipOptions {
  let options: TooltipOptions;

  if (typeof value === 'string') {
    options = { content: value };
  } else if (value && typeof value === 'object') {
    options = { ...value };
  } else {
    options = {};
  }

  // Modifiers can also specify placement (e.g., v-clean-tooltip.bottom)
  if (modifiers.top) {
    options.placement = 'top';
  } else if (modifiers.bottom) {
    options.placement = 'bottom';
  } else if (modifiers.left) {
    options.placement = 'left';
  } else if (modifiers.right) {
    options.placement = 'right';
  }

  return options;
}

export default cleanTooltipDirective;

// Exporting for unit testing purposes
export {
  onMouseEnter,
  onMouseLeave,
  onMouseClick
};
