import { mount } from '@vue/test-utils';
import DragGrip from '@shell/components/DragGrip.vue';

describe('component: DragGrip', () => {
  it('should be hidden from screen readers', () => {
    expect(mount(DragGrip).attributes('aria-hidden')).toBe('true');
  });

  it('should pass a class, test id and mousedown through to its root', async() => {
    const onMousedown = jest.fn();
    const wrapper = mount(DragGrip, {
      attrs: {
        class: 'column-handle', 'data-testid': 'grip', onMousedown
      }
    });

    await wrapper.trigger('mousedown');

    expect(wrapper.classes()).toStrictEqual(['drag-grip', 'column-handle']);
    expect(wrapper.attributes('data-testid')).toBe('grip');
    expect(onMousedown).toHaveBeenCalledTimes(1);
  });
});
