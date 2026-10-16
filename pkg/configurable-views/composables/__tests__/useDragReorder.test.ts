import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';

import { DragReorderOptions, useDragReorder } from '@pkg/configurable-views/composables/useDragReorder';

// A list of four whose items sit 10 apart along the axis, so the pointer at 25 is over the third
function setup(overrides: Partial<DragReorderOptions> = {}) {
  const onCommit = jest.fn();
  const measure = jest.fn();
  let drag: ReturnType<typeof useDragReorder>;

  const wrapper = mount(defineComponent({
    setup() {
      drag = useDragReorder({
        axis:         'y',
        initialOrder: () => ['a', 'b', 'c', 'd'],
        measure,
        indexAt:      (pointer) => Math.min(Math.max(Math.floor(pointer / 10), 0), 3),
        onCommit,
        ...overrides,
      });

      return () => h('div');
    }
  }));

  return {
    drag: drag!, onCommit, measure, wrapper
  };
}

const press = (y: number) => new MouseEvent('mousedown', {
  clientY: y, clientX: 0, button: 0
});
const moveTo = (y: number) => window.dispatchEvent(new MouseEvent('mousemove', { clientY: y, clientX: 0 }));
const release = () => window.dispatchEvent(new MouseEvent('mouseup'));
const key = (k: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));

describe('useDragReorder', () => {
  afterEach(() => {
    document.body.style.cursor = '';
  });

  it('should not pick an item up until the pointer has travelled with it held', () => {
    const { drag, measure } = setup();

    drag.start('a', press(5));
    moveTo(7);

    expect(drag.heldId.value).toBeNull();
    expect(drag.order.value).toBeNull();
    expect(measure).not.toHaveBeenCalled();
  });

  it('should pick the item up, measure once, and follow the pointer once it has travelled', () => {
    const { drag, measure } = setup();

    drag.start('a', press(5));
    moveTo(25);
    moveTo(35);

    expect(drag.heldId.value).toBe('a');
    expect(drag.order.value).toStrictEqual(['b', 'c', 'd', 'a']);
    expect(measure).toHaveBeenCalledTimes(1);
    expect(document.body.style.cursor).toBe('grabbing');
  });

  it('should hand the new order over when the item is dropped somewhere else', () => {
    const { drag, onCommit } = setup();

    drag.start('a', press(5));
    moveTo(25);
    release();

    expect(onCommit).toHaveBeenCalledWith(['b', 'c', 'a', 'd']);
    expect(drag.order.value).toBeNull();
    expect(drag.heldId.value).toBeNull();
    expect(document.body.style.cursor).toBe('');
  });

  it('should write nothing when the item is dropped back where it started', () => {
    const { drag, onCommit } = setup();

    drag.start('b', press(15));
    moveTo(25);
    moveTo(15);
    release();

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('should abandon the drag on Escape, writing nothing', () => {
    const { drag, onCommit } = setup();

    drag.start('a', press(5));
    moveTo(35);
    key('Escape');
    release();

    expect(onCommit).not.toHaveBeenCalled();
    expect(drag.order.value).toBeNull();
  });

  it('should not let an item into the places held at the head of the list', () => {
    const { drag } = setup({ firstMovable: () => 1 });

    drag.start('d', press(35));
    moveTo(0);

    expect(drag.order.value).toStrictEqual(['a', 'd', 'b', 'c']);
  });

  it('should swallow the click that follows a drop, and only that one', async() => {
    const { drag } = setup();
    const clicked = jest.fn();

    window.addEventListener('click', clicked);
    drag.start('a', press(5));
    moveTo(25);
    release();
    window.dispatchEvent(new MouseEvent('click'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    window.dispatchEvent(new MouseEvent('click'));
    window.removeEventListener('click', clicked);

    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('should leave a click alone when nothing was dragged', () => {
    const { drag } = setup();
    const clicked = jest.fn();

    window.addEventListener('click', clicked);
    drag.start('a', press(5));
    release();
    window.dispatchEvent(new MouseEvent('click'));
    window.removeEventListener('click', clicked);

    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('should end a drag in progress when its component goes, writing nothing', () => {
    const { drag, onCommit, wrapper } = setup();

    drag.start('a', press(5));
    moveTo(35);
    wrapper.unmount();
    release();

    expect(onCommit).not.toHaveBeenCalled();
    expect(document.body.style.cursor).toBe('');
  });

  it('should read the pointer along the axis the list runs', () => {
    const { drag } = setup({ axis: 'x' });

    drag.start('a', new MouseEvent('mousedown', { clientX: 5, clientY: 999 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 25, clientY: 999 }));

    expect(drag.order.value).toStrictEqual(['b', 'c', 'a', 'd']);
  });
});
