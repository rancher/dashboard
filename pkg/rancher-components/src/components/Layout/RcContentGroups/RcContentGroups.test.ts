import { shallowMount } from '@vue/test-utils';
import RcContentGroups from './RcContentGroups.vue';
import ExportedRcContentGroups from './index';

describe('component: RcContentGroups', () => {
  function createWrapper(defaultSlot?: string) {
    return shallowMount(RcContentGroups, { slots: defaultSlot === undefined ? {} : { default: defaultSlot } });
  }

  it('should render a wrapper carrying the content groups class', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.rc-content-groups').exists()).toBe(true);
  });

  it.each([
    ['a single group', '<span class="group">Only</span>', ['Only']],
    ['several groups', '<span class="group">First</span><span class="group">Second</span>', ['First', 'Second']],
  ])('should nest %s from the default slot inside the stack', (_label, slot, expected) => {
    const wrapper = createWrapper(slot);
    const rendered = wrapper.findAll('.rc-content-groups .group');

    expect(rendered.map((group) => group.text())).toStrictEqual(expected);
  });

  // The `:empty` rule that hides such a stack is scoped CSS, which VTU does not
  // apply. What is testable here is the precondition it depends on: the wrapper
  // holds nothing that `:empty` counts as content.
  it('should leave nothing that defeats the :empty rule when its content is conditioned out', () => {
    const wrapper = createWrapper('<span v-if="false" />');
    const childNodes = [...wrapper.element.childNodes];
    const countsAsContent = (node: ChildNode) => node.nodeType !== Node.COMMENT_NODE && !(node.nodeType === Node.TEXT_NODE && node.textContent === '');

    // Vue leaves the slot fragment's anchors behind, so an empty list would mean
    // this assertion had stopped testing anything.
    expect(childNodes.length).toBeGreaterThan(0);
    expect(childNodes.filter(countsAsContent)).toStrictEqual([]);
  });

  it('should be re-exported from the component index so consumers can import it', () => {
    expect(ExportedRcContentGroups).toBe(RcContentGroups);
  });
});
