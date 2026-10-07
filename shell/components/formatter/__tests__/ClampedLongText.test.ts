import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ClampedLongText from '@shell/components/formatter/ClampedLongText.vue';

/** Lays the text out as the browser would: how tall and wide it is, against the box it is shown in */
function layOut(el: HTMLElement, {
  scrollHeight = 18, clientHeight = 18, scrollWidth = 100, clientWidth = 100
}) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
}

let resized: (() => void) | null = null;

class FakeResizeObserver {
  constructor(callback: () => void) {
    resized = callback;
  }

  observe() {}

  disconnect() {}
}

const mountText = (value: string | null) => mount(ClampedLongText, {
  props:  { value },
  global: {
    directives: {
      'clean-tooltip': (el: HTMLElement, binding: { value: { content: string } }) => {
        el.setAttribute('data-tooltip', binding.value.content);
      }
    }
  }
});

describe('component: ClampedLongText', () => {
  beforeEach(() => {
    resized = null;
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
  });

  afterEach(() => {
    delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
  });

  it('should show the text', () => {
    expect(mountText('A long description').text()).toBe('A long description');
  });

  it('should offer no tooltip while the text fits', async() => {
    const wrapper = mountText('Short note');

    layOut(wrapper.element as HTMLElement, {});
    resized?.();
    await nextTick();

    expect(wrapper.attributes('data-tooltip')).toBe('');
  });

  it.each([
    ['wraps onto more lines than are shown', { scrollHeight: 90, clientHeight: 54 }],
    ['has a word too long for its widest line', { scrollWidth: 340, clientWidth: 300 }],
  ])('should offer the whole text as a tooltip when it %s', async(_, layout) => {
    const wrapper = mountText('A long description');

    layOut(wrapper.element as HTMLElement, layout);
    resized?.();
    await nextTick();

    expect(wrapper.attributes('data-tooltip')).toBe('A long description');
  });

  it('should drop the tooltip once the column is wide enough again', async() => {
    const wrapper = mountText('A long description');
    const el = wrapper.element as HTMLElement;

    layOut(el, { scrollHeight: 90, clientHeight: 54 });
    resized?.();
    await nextTick();
    layOut(el, {});
    resized?.();
    await nextTick();

    expect(wrapper.attributes('data-tooltip')).toBe('');
  });

  it('should show nothing, and offer no tooltip, without a value', () => {
    const wrapper = mountText(null);

    expect(wrapper.text()).toBe('');
    expect(wrapper.attributes('data-tooltip')).toBe('');
  });
});
