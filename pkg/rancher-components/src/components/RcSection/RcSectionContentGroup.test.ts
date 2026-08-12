import { shallowMount } from '@vue/test-utils';
import RcSectionContentGroup from './RcSectionContentGroup.vue';
import { RcSectionContentGroup as ExportedRcSectionContentGroup } from './index';

describe('component: RcSectionContentGroup', () => {
  function createWrapper(defaultSlot?: string) {
    return shallowMount(RcSectionContentGroup, { slots: defaultSlot === undefined ? {} : { default: defaultSlot } });
  }

  it('should render a wrapper carrying the content group class and test id', () => {
    const wrapper = createWrapper();
    const group = wrapper.find('[data-testid="rc-section-content-group"]');

    expect(group.exists()).toBe(true);
    expect(group.classes()).toContain('rc-section-content-group');
  });

  it.each([
    ['a single child', '<span class="child">Only</span>', ['Only']],
    ['several children', '<span class="child">First</span><span class="child">Second</span>', ['First', 'Second']],
  ])('should nest %s from the default slot inside the group', (_label, slot, expected) => {
    const wrapper = createWrapper(slot);
    const rendered = wrapper.findAll('[data-testid="rc-section-content-group"] .child');

    expect(rendered.map((child) => child.text())).toStrictEqual(expected);
  });

  // The `:empty` rule that hides such a group is scoped CSS, which VTU does not
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
    expect(ExportedRcSectionContentGroup).toBe(RcSectionContentGroup);
  });
});
