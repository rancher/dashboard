import { shallowMount } from '@vue/test-utils';
import RcContentGroup from './RcContentGroup.vue';
import ExportedRcContentGroup from './index';

describe('component: RcContentGroup', () => {
  function createWrapper(defaultSlot?: string) {
    return shallowMount(RcContentGroup, { slots: defaultSlot === undefined ? {} : { default: defaultSlot } });
  }

  it('should render a wrapper carrying the content group class', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.rc-content-group').exists()).toBe(true);
  });

  it.each([
    ['a single child', '<span class="child">Only</span>', ['Only']],
    ['several children', '<span class="child">First</span><span class="child">Second</span>', ['First', 'Second']],
  ])('should nest %s from the default slot inside the group', (_label, slot, expected) => {
    const wrapper = createWrapper(slot);
    const rendered = wrapper.findAll('.rc-content-group .child');

    expect(rendered.map((child) => child.text())).toStrictEqual(expected);
  });

  it('should be re-exported from the component index so consumers can import it', () => {
    expect(ExportedRcContentGroup).toBe(RcContentGroup);
  });
});
