import { mount } from '@vue/test-utils';
import TabBodyContainer from '@shell/components/nav/WindowManager/panels/TabBodyContainer.vue';
import { BOTTOM } from '@shell/utils/position';

const CONTENT_ID = 'wm-panel-body-bottom-kubectl-local';

describe('component: TabBodyContainer', () => {
  it('should be the tabpanel the tab aria-controls points at', () => {
    const wrapper = mount(TabBodyContainer, { props: { id: 'kubectl:local', position: BOTTOM } });

    expect(wrapper.attributes('id')).toBe(CONTENT_ID);
    expect(wrapper.attributes('role')).toBe('tabpanel');
  });

  it('should emit the content id once mounted', () => {
    const wrapper = mount(TabBodyContainer, { props: { id: 'kubectl:local', position: BOTTOM } });

    expect(wrapper.emitted('ready')).toStrictEqual([[CONTENT_ID]]);
  });
});
