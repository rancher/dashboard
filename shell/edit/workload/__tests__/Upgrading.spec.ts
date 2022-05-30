import { mount } from '@vue/test-utils';
import Upgrading from '@shell/edit/workload/Upgrading.vue';

describe('component: Upgrading', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(Upgrading, { propsData: { value: { template: { spec: { terminationGracePeriodSeconds: null } } } } });

    const inputWraps = wrapper.findAll('[data-testid^=input-policy-]');

    expect(inputWraps).toHaveLength(7);
  });

  it('should update state with inserted values', () => {
    // required to do not break the view
    const value = { template: { spec: { terminationGracePeriodSeconds: null } } };
    const wrapper = mount(Upgrading, { propsData: { value } });
    const input = wrapper.find('[data-testid="input-policy-limit"]').find('input');
    const limit = 123;

    input.setValue(limit);

    expect(wrapper.props('value').revisionHistoryLimit).toBe(limit);
  });
});
