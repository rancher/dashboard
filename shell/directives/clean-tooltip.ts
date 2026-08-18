import { DirectiveBinding, Directive } from 'vue';
import { destroyTooltip, createTooltip } from 'floating-vue';
import { purifyHTML } from '@shell/plugins/clean-html';

// This is a singleton tooltip implementation that improves performance on pages with many tooltips.
// Instead of instantiating a Vue component for every tooltip on the page, this directive attaches lightweight event listeners.
// It then imperatively creates and destroys a single tooltip instance as needed, avoiding the high upfront memory and processing cost of many Vue components.
let singleton: ReturnType<typeof createTooltip> | null = null;
let currentTarget: TooltipHTMLElement | null = null;

let describedByObserver: MutationObserver | null = null;
const observedTargets = new Set<TooltipHTMLElement>();

let descriptionContainer: HTMLElement | null = null;
let descriptionCount = 0;

const DESCRIBED_BY_OBSERVER_OPTIONS = { attributeFilter: ['aria-describedby'] };

const DEFAULT_SHOW_DELAY = 200;

const HOVERABLE_HIDE_DELAY = 300;

interface TooltipDelay {
  show?: number;
  hide?: number;
}

// Options are optional, to be handled by floating-vue's defaults
export interface TooltipOptions {
  content?: string;
  placement?: string;
  popperClass?: string | string[];
  delay?: TooltipDelay;
  triggers?: string[];
  hideTriggers?: (triggers: string[]) => string[];
  popperTriggers?: string[];
  onApplyHide?: () => void;
}

interface TooltipHTMLElement extends HTMLElement {
  // Store the whole options object for the tooltip
  __tooltipOptions__: TooltipOptions;
  __tooltipDescriptionId__?: string;
  __tooltipDescriptionSource__?: string;
  __tooltipDescriptionText__?: string;
}

/**
 * Returns the shared hidden host for the description nodes, creating it if it is missing or has
 * been detached from the document.
 * @returns {HTMLElement} The description container, attached to the body.
 */
function ensureDescriptionContainer(): HTMLElement {
  if (!descriptionContainer?.isConnected) {
    descriptionContainer = document.createElement('div');
    descriptionContainer.style.display = 'none';
    descriptionContainer.setAttribute('data-clean-tooltip-descriptions', '');
    document.body.appendChild(descriptionContainer);
  }

  return descriptionContainer;
}

/**
 * Flattens tooltip content to the plain text assistive technology needs.
 * @param {string} content The raw tooltip content.
 * @returns {string} The tooltip text, or an empty string when there is nothing to describe.
 */
function getDescriptionText(content: string): string {
  if (!/[<&]/.test(content)) {
    return content.trim();
  }

  return new DOMParser().parseFromString(purifyContent(content), 'text/html').body.textContent?.trim() || '';
}

/**
 * Keeps the element's hidden description node in step with its tooltip content, and points
 * aria-describedby at it unless a popper is currently describing the element.
 * @param {TooltipHTMLElement} el The element the directive is bound to.
 */
function syncDescription(el: TooltipHTMLElement) {
  const content = el.__tooltipOptions__?.content || '';

  if (el.__tooltipDescriptionSource__ !== content) {
    el.__tooltipDescriptionSource__ = content;
    el.__tooltipDescriptionText__ = getDescriptionText(content);
  }

  const text = el.__tooltipDescriptionText__;

  if (!text || text === el.textContent?.trim()) {
    removeDescription(el);

    return;
  }

  if (!el.__tooltipDescriptionId__) {
    el.__tooltipDescriptionId__ = `clean-tooltip-description-${ ++descriptionCount }`;
  }

  const container = ensureDescriptionContainer();
  let node = document.getElementById(el.__tooltipDescriptionId__);

  if (!node) {
    node = document.createElement('span');
    node.id = el.__tooltipDescriptionId__;
  }

  if (node.parentNode !== container) {
    container.appendChild(node);
  }

  node.textContent = text;

  if (currentTarget === el) {
    return;
  }

  if (el.getAttribute('aria-describedby') !== el.__tooltipDescriptionId__) {
    el.setAttribute('aria-describedby', el.__tooltipDescriptionId__);
  }
}

/**
 * Removes the element's hidden description node and the reference to it.
 * @param {TooltipHTMLElement} el The element the directive is bound to.
 */
function removeDescription(el: TooltipHTMLElement) {
  if (!el.__tooltipDescriptionId__) {
    return;
  }

  document.getElementById(el.__tooltipDescriptionId__)?.remove();

  if (el.getAttribute('aria-describedby') === el.__tooltipDescriptionId__) {
    el.removeAttribute('aria-describedby');
  }

  delete el.__tooltipDescriptionId__;
  delete el.__tooltipDescriptionSource__;
  delete el.__tooltipDescriptionText__;
}

/**
 * Reacts to floating-vue writing the trigger's aria-describedby, applying role="tooltip" to the
 * popper it points at, or restoring the element's own description once it is cleared.
 * @param {TooltipHTMLElement} target The element being observed.
 */
function onDescribedByChange(target: TooltipHTMLElement) {
  const id = target.getAttribute('aria-describedby');
  const popper = id && id !== target.__tooltipDescriptionId__ ? document.getElementById(id) : null;

  if (popper) {
    popper.setAttribute('role', 'tooltip');
  } else {
    syncDescription(target);
  }
}

/**
 * Starts watching the given trigger's aria-describedby. Watching continues until the trigger
 * unmounts, because floating-vue clears the attribute well after the tooltip was torn down.
 * @param {TooltipHTMLElement} target The element the directive is bound to.
 */
function observeDescribedBy(target: TooltipHTMLElement) {
  describedByObserver ||= new MutationObserver((records) => {
    records.forEach((record) => onDescribedByChange(record.target as TooltipHTMLElement));
  });

  describedByObserver.observe(target, DESCRIBED_BY_OBSERVER_OPTIONS);
  observedTargets.add(target);
}

/**
 * Stops watching the given trigger's aria-describedby.
 * @param {TooltipHTMLElement} target The element the directive is bound to.
 */
function unobserveDescribedBy(target: TooltipHTMLElement) {
  if (!observedTargets.delete(target)) {
    return;
  }

  describedByObserver?.disconnect();
  observedTargets.forEach((el) => describedByObserver?.observe(el, DESCRIBED_BY_OBSERVER_OPTIONS));
}

/**
 * Whether anything other than a click shows the element's tooltip.
 * @param {TooltipOptions} options The element's tooltip options.
 * @returns {boolean} True when hover or focus shows the tooltip.
 */
function showsWithoutClick(options?: TooltipOptions): boolean {
  const triggers = options?.triggers || [];

  return triggers.includes('hover') || triggers.includes('focus');
}

/**
 * Whether the pointer shows the element's tooltip, and so has to be able to reach the popper.
 * @param {TooltipOptions} options The element's tooltip options.
 * @returns {boolean} True when hover shows the tooltip.
 */
function isHoverable(options?: TooltipOptions): boolean {
  return (options?.triggers || ['hover']).includes('hover');
}

/**
 * Builds the config handed to floating-vue, adding what WCAG 1.4.13 asks of content shown on
 * hover: a popper the pointer can reach, and a click that does not dismiss what it just opened.
 * @param {TooltipHTMLElement} target The element the tooltip is attached to.
 * @param {TooltipOptions} options The element's tooltip options.
 * @param {string} content The purified tooltip content.
 * @returns {TooltipOptions} The config to create the tooltip with.
 */
function getTooltipConfig(target: TooltipHTMLElement, options: TooltipOptions, content: string): TooltipOptions {
  const config: TooltipOptions = { ...options, content };

  if (options.triggers?.includes('click') && showsWithoutClick(options)) {
    config.hideTriggers = (triggers: string[]) => triggers.filter((trigger) => trigger !== 'click');
  }

  if (isHoverable(options)) {
    config.popperTriggers = ['hover'];
    config.delay = {
      show: options.delay?.show ?? DEFAULT_SHOW_DELAY,
      hide: options.delay?.hide ?? HOVERABLE_HIDE_DELAY,
    };
    config.onApplyHide = () => hideSingletonTooltip(target);
  }

  return config;
}

/**
 * Shows a singleton tooltip for the given target element.
 * If a tooltip is already active, it is hidden before showing the new one.
 * @param {HTMLElement} target The element to which the tooltip is attached.
 * @param {TooltipOptions} options The options for the tooltip.
 */
function showSingletonTooltip(target: TooltipHTMLElement, options: TooltipOptions) {
  // If a tooltip is already active, it should be hidden before showing the new one.
  if (currentTarget) {
    hideSingletonTooltip(currentTarget);
  }

  const purifiedContent = options.content ? purifyContent(options.content) : '';

  // Don't show the tooltip if the content is empty.
  if (!purifiedContent) {
    return;
  }

  // Create a new tooltip instance.
  singleton = createTooltip(target, getTooltipConfig(target, options, purifiedContent), {});

  singleton.show();
  currentTarget = target;

  observeDescribedBy(target);

  document.addEventListener('keydown', onDocumentKeyDown);
}

/**
 * Hides the singleton tooltip if it is currently shown for the given target element.
 * @param {HTMLElement} target The element from which the tooltip should be hidden.
 */
function hideSingletonTooltip(target: TooltipHTMLElement) {
  if (currentTarget !== target) {
    return;
  }

  singleton = null;
  currentTarget = null;

  document.removeEventListener('keydown', onDocumentKeyDown);
  destroyTooltip(target);

  syncDescription(target);
}

/**
 * Shows the singleton tooltip for the given target when it is hidden, and hides it when it is
 * already shown.
 * @param {TooltipHTMLElement} target The element the tooltip is attached to.
 */
function toggleSingletonTooltip(target: TooltipHTMLElement) {
  if (currentTarget === target) {
    hideSingletonTooltip(target);
  } else {
    showSingletonTooltip(target, target.__tooltipOptions__);
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

    syncDescription(el);
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

    syncDescription(el);

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
    hideSingletonTooltip(el);

    unobserveDescribedBy(el);

    removeDescription(el);
  },
};

/**
 * Event handler for mouseenter and focus events.
 * @param {Event} e The event object.
 */
function onMouseEnter(e: MouseEvent | FocusEvent) {
  const el = e.currentTarget as TooltipHTMLElement;

  if (currentTarget === el) {
    return;
  }

  showSingletonTooltip(el, el.__tooltipOptions__);
}

/**
 * Event handler for mouseleave and blur events.
 * @param {Event} e The event object.
 */
function onMouseLeave(e: MouseEvent | FocusEvent) {
  const el = e.currentTarget as TooltipHTMLElement;

  if (isHoverable(el.__tooltipOptions__)) {
    return;
  }

  hideSingletonTooltip(el);
}

/**
 * Event handler for click events.
 * @param {Event} e The event object.
 */
function onMouseClick(e: MouseEvent) {
  const el = e.currentTarget as TooltipHTMLElement;

  if (currentTarget === el && showsWithoutClick(el.__tooltipOptions__)) {
    return;
  }

  toggleSingletonTooltip(el);
}

/**
 * Document level handler dismissing the shown tooltip on Escape, wherever focus happens to be.
 * @param {KeyboardEvent} e The keyboard event object.
 */
function onDocumentKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && currentTarget) {
    hideSingletonTooltip(currentTarget);
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
