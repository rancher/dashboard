import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LimitedCell from '@shell/components/SortableTable/LimitedCell.vue';
import type { CellLimits } from '@shell/components/SortableTable/LimitedCell.vue';

/** Lays the text out as the browser would: how tall and wide it is, against the box it is shown in */
function layOut(el: HTMLElement, {
  scrollHeight = 18, clientHeight = 18, scrollWidth = 100, clientWidth = 100
}) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
}

type Resize = () => void;

const resized = new Map<Element, Resize>();
const unobserved: Element[] = [];

class FakeResizeObserver {
  callback: (entries: { target: Element }[]) => void;

  constructor(callback: (entries: { target: Element }[]) => void) {
    this.callback = callback;
  }

  observe(el: Element) {
    resized.set(el, () => this.callback([{ target: el }]));
  }

  unobserve(el: Element) {
    unobserved.push(el);
  }
}

(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;

const CLAMPED: CellLimits = {
  minWidth: 100, maxWidth: 300, lineClamp: 3
};

const mountCell = (text: string, limits: CellLimits = CLAMPED) => mount(LimitedCell, {
  props:  { limits },
  slots:  { default: () => text },
  global: {
    directives: {
      'clean-tooltip': (el: HTMLElement, binding: { value: { content: string } }) => {
        el.setAttribute('data-tooltip', binding.value.content);
      }
    }
  }
});

const resize = async(el: Element) => {
  resized.get(el)?.();
  await nextTick();
};

describe('component: LimitedCell', () => {
  it('should show what the cell holds', () => {
    expect(mountCell('A long description').text()).toBe('A long description');
  });

  it('should keep the box within the column\'s widths and lines', () => {
    const style = (mountCell('text').element as HTMLElement).style;

    expect(style.minWidth).toBe('100px');
    expect(style.maxWidth).toBe('300px');
    expect(mountCell('text').classes()).toContain('clamped');
  });

  it('should leave out the limits a column doesn\'t set', () => {
    const wrapper = mountCell('text', { maxWidth: 200 });
    const style = (wrapper.element as HTMLElement).style;

    expect(style.minWidth).toBe('');
    expect(style.maxWidth).toBe('200px');
    expect(wrapper.classes()).not.toContain('clamped');
  });

  it('should offer no tooltip while the text fits', async() => {
    const wrapper = mountCell('Short note');

    layOut(wrapper.element as HTMLElement, {});
    await resize(wrapper.element);

    expect(wrapper.attributes('data-tooltip')).toBe('');
  });

  it.each([
    ['wraps onto more lines than are shown', { scrollHeight: 90, clientHeight: 54 }],
    ['has a word too long for its widest line', { scrollWidth: 340, clientWidth: 300 }],
  ])('should offer the whole text as a tooltip when it %s', async(_, layout) => {
    const wrapper = mountCell('A long description');

    layOut(wrapper.element as HTMLElement, layout);
    await resize(wrapper.element);

    expect(wrapper.attributes('data-tooltip')).toBe('A long description');
  });

  it('should offer the text as it reads, not as markup', async() => {
    const wrapper = mountCell('Needs <gpu> & fast nodes');

    layOut(wrapper.element as HTMLElement, { scrollHeight: 90, clientHeight: 54 });
    await resize(wrapper.element);

    expect(wrapper.attributes('data-tooltip')).toBe('Needs &lt;gpu&gt; &amp; fast nodes');
  });

  it('should drop the tooltip once the column is wide enough again', async() => {
    const wrapper = mountCell('A long description');
    const el = wrapper.element as HTMLElement;

    layOut(el, { scrollHeight: 90, clientHeight: 54 });
    await resize(el);
    layOut(el, {});
    await resize(el);

    expect(wrapper.attributes('data-tooltip')).toBe('');
  });

  it('should offer no tooltip without a line limit, which can\'t cut the text', async() => {
    const wrapper = mountCell('A long description', { maxWidth: 200 });

    layOut(wrapper.element as HTMLElement, { scrollHeight: 90, clientHeight: 54 });
    await resize(wrapper.element);

    expect(wrapper.attributes('data-tooltip')).toBe('');
  });

  it('should stop watching the cell once it goes', () => {
    const wrapper = mountCell('text');
    const el = wrapper.element;

    wrapper.unmount();

    expect(unobserved).toContain(el);
  });
});
