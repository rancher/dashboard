import { mount } from '@vue/test-utils';
import RcStatusIndicator, { Shape } from './index';
import { Status } from '@components/Pill/types';

describe('component: RcStatusIndicator', () => {
  const shapes: Shape[] = ['disc', 'horizontal-bar', 'vertical-bar'];
  const statuses: Status[] = ['info', 'success', 'warning', 'error', 'unknown', 'none'];

  const combinations: {shape: Shape, status: Status}[] = [];

  shapes.forEach((shape) => {
    statuses.forEach((status) => {
      combinations.push({
        shape,
        status
      });
    });
  });

  it.each(combinations)('should apply correct classes for shape "$shape" and status "$status"', ({ shape, status }) => {
    const wrapper = mount(RcStatusIndicator, {
      props: {
        shape,
        status,
      }
    });

    const shapeEl = wrapper.find('.shape');

    expect(shapeEl.classes()).toContain(shape);
    expect(shapeEl.classes()).toContain(status);
  });
});
