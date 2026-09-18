import { VueWrapper } from '@vue/test-utils';

/** Builds a DOMRect from its left edge and width, for the stubs below. */
export const rect = (left: number, width: number, top = 0, height = 29): DOMRect => ({
  left,
  right:  left + width,
  top,
  bottom: top + height,
  width,
  height,
  x:      left,
  y:      top,
  toJSON: () => ({}),
} as DOMRect);

interface TabBarRects {
  bar: DOMRect;
  list: DOMRect;
  tab: DOMRect;
  closer: DOMRect;
}

/**
 * Gives the tab bar, the tab list, the active tab and its close icon a fixed geometry.
 *
 * @returns the stubbed elements.
 */
export const stubTabBarRects = (wrapper: VueWrapper, {
  bar, list, tab, closer
}: TabBarRects) => {
  const barElement = wrapper.get('.tabs').element;
  const listElement = wrapper.get('[role="tablist"]').element;
  const tabElement = wrapper.get('[role="tab"][aria-selected="true"]').element;
  const closerElement = wrapper.get('[role="tab"][aria-selected="true"] [data-testid="wm-tab-close-button"]').element;

  barElement.getBoundingClientRect = () => bar;
  listElement.getBoundingClientRect = () => list;
  tabElement.getBoundingClientRect = () => tab;
  closerElement.getBoundingClientRect = () => closer;
  Object.defineProperty(barElement, 'clientLeft', { value: 1, configurable: true });
  Object.defineProperty(barElement, 'clientTop', { value: 1, configurable: true });

  return {
    barElement, listElement, closerElement
  };
};

/**
 * Replaces ResizeObserver for the current test file.
 *
 * @returns the observed elements, the disconnect spy, and a trigger for the observer's callback.
 */
export const mockResizeObserver = () => {
  const observed: Element[] = [];
  const disconnect = jest.fn();
  let notify = () => {};

  window.ResizeObserver = jest.fn().mockImplementation((callback: () => void) => {
    notify = callback;

    return {
      observe:   (element: Element) => observed.push(element),
      unobserve: jest.fn(),
      disconnect,
    };
  });

  return {
    observed,
    disconnect,
    notify: () => notify(),
  };
};
