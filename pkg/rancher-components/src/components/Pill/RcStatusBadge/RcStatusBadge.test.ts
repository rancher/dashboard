import { mount } from '@vue/test-utils';
import RcStatusBadge from './index';
import { Status } from '@components/Pill/types';

describe('component: RcStatusBadge', () => {
  const statuses: Status[] = ['info', 'success', 'warning', 'error', 'unknown', 'none'];

  it.each(statuses)('should apply correct classes for shape and status "%s"', (status) => {
    const wrapper = mount(RcStatusBadge, { props: { status } });

    const shapeEl = wrapper.find('.rc-status-badge');

    expect(shapeEl.classes()).toContain(status);
  });
});
