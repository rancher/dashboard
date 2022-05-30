import { mount } from '@vue/test-utils';
import Upgrading from '@shell/edit/workload/Upgrading.vue';

describe('component: Upgrading', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(Upgrading);

    const inputWraps = wrapper.findAll('[data-testid^=input-policy-]');

    expect(inputWraps).toHaveLength(7);
  });

  it('should update state with inserted values', () => {
    // required to do not break the view
    const wrapper = mount(Upgrading);
    const input = wrapper.find('[data-testid="input-policy-limit"]').find('input');
    const limit = 123;

    input.setValue(limit);
    input.trigger('blur');

    expect(wrapper.props('value').revisionHistoryLimit).toBe(limit);
  });
});
