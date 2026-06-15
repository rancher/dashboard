import { mount } from '@vue/test-utils';
import Upgrading from '@shell/edit/workload/Upgrading.vue';

describe('component: Upgrading', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(Upgrading);

    const inputWraps = wrapper.findAll('[data-testid^=input-policy-]');

    expect(inputWraps).toHaveLength(7);
  });

  it.each([
    ['min', 'minReadySeconds'],
    ['limit', 'revisionHistoryLimit'],
    ['deadline', 'progressDeadlineSeconds'],
  ])('should set typed value in %p into %p', (field, key) => {
    const wrapper = mount(Upgrading);
    const input = wrapper.find(`[data-testid="input-policy-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);
    input.trigger('blur');

    expect(wrapper.props('value')?.[key]).toBe(newValue);
  });

  it.each([
    ['maxSurge', '%'],
    ['maxUnavailable', '%'],
  ])('should set typed value in %p with %p unit', (key, unit) => {
    const wrapper = mount(Upgrading);
    const newValue = 123;
    const expectation = `${ newValue }${ unit }`;

    wrapper.vm.updateWithUnits({ selected: unit, text: newValue }, key);

    expect(wrapper.vm[key]).toBe(newValue);
    expect(wrapper.props('value')?.strategy.rollingUpdate[key]).toBe(expectation);
  });

  it.each([
    'surge',
    'unavailable',
    'min',
    'limit',
    'deadline',
  ])('should emit an update on %p input blur', (field) => {
    const wrapper = mount(Upgrading);
    const input = wrapper.find(`[data-testid="input-policy-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);
    input.trigger('blur');

    expect(wrapper.emitted('input')).toHaveLength(1);
  });
});
