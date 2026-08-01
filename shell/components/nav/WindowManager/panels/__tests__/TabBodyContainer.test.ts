import { mount } from '@vue/test-utils';
import TabBodyContainer from '@shell/components/nav/WindowManager/panels/TabBodyContainer.vue';
import { tabBodyId } from '@shell/components/nav/WindowManager/panels/tab-body';
import { BOTTOM } from '@shell/utils/position';

describe('component: TabBodyContainer', () => {
  it('should be the tabpanel the tab aria-controls points at', () => {
    const wrapper = mount(TabBodyContainer, { props: { id: 'kubectl:local', position: BOTTOM } });

    expect(wrapper.attributes('id')).toBe(tabBodyId(BOTTOM, 'kubectl:local'));
    expect(wrapper.attributes('role')).toBe('tabpanel');
  });

  it('should emit the content id once mounted', () => {
    const wrapper = mount(TabBodyContainer, { props: { id: 'kubectl:local', position: BOTTOM } });

    expect(wrapper.emitted('ready')).toStrictEqual([[tabBodyId(BOTTOM, 'kubectl:local')]]);
  });
});
