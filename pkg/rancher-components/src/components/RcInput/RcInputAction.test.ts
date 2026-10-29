import { mount } from '@vue/test-utils';
import RcInputAction from './RcInputAction.vue';
import type { RcFieldSize } from '@components/RcField/types';

const SIZES: RcFieldSize[] = ['small', 'medium', 'large'];

describe('component: RcInputAction', () => {
  it.each(SIZES)('sizes the icon for a %s field', (size) => {
    const wrapper = mount(RcInputAction, {
      props: {
        icon: 'close', label: 'Clear', size
      }
    });

    expect(wrapper.classes()).toContain(`rc-input-action-${ size }`);
    expect(wrapper.find('.rc-icon').classes()).toContain('inherit');
  });

  it('defaults to the medium size', () => {
    const wrapper = mount(RcInputAction, { props: { icon: 'close', label: 'Clear' } });

    expect(wrapper.classes()).toContain('rc-input-action-medium');
  });

  it('names the button with its label', () => {
    const wrapper = mount(RcInputAction, { props: { icon: 'close', label: 'Clear' } });

    expect(wrapper.attributes('aria-label')).toStrictEqual('Clear');
  });
});
