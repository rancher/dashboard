import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import cleanTooltip from '@shell/directives/clean-tooltip';
import { waitForTooltip } from './utils/tooltip';

const mountOptions = { global: { directives: { 'clean-tooltip': cleanTooltip } }, attachTo: document.body };

const getPopper = () => document.querySelector('.v-popper__popper') as HTMLElement;

/**
 * A component that hands the directive a FRESH options object on every render, which is what a binding
 * like `v-clean-tooltip="describe(row)"` does. `tick` only forces a re-render; it changes nothing the
 * tooltip renders from.
 */
const rerendering = {
  data:     () => ({ tick: 0, label: 'Pull secrets' }),
  computed: {
    tooltip(): any {
      return { content: (this as any).label, placement: 'right' };
    },
  },
  template: `<button v-clean-tooltip="tooltip" type="button">{{ tick }}</button>`,
};

describe('clean-tooltip across re-renders', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  // Re-showing tears the popper down and builds a new one, which the user sees as a blink. The owning
  // component re-renders for reasons of its own — a list refreshing behind a hovered row — and the
  // tooltip has no business flickering for something that says nothing new.
  it('keeps the same popper when a re-render changes nothing about the tooltip', async() => {
    const wrapper = mount(rerendering, mountOptions);

    wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
    await waitForTooltip();

    const before = getPopper();

    expect(before).not.toBeNull();

    await wrapper.setData({ tick: 1 });
    await nextTick();
    await wrapper.setData({ tick: 2 });
    await nextTick();

    // The very same element, not a replacement that happens to look alike.
    expect(getPopper()).toBe(before);

    wrapper.unmount();
  });

  it('rebuilds it when the content really does change', async() => {
    const wrapper = mount(rerendering, mountOptions);

    wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
    await waitForTooltip();

    const before = getPopper();

    await wrapper.setData({ label: 'Registry secrets' });
    await nextTick();
    await waitForTooltip();

    expect(getPopper()).not.toBe(before);
    expect(getPopper().textContent).toContain('Registry secrets');

    wrapper.unmount();
  });
});
