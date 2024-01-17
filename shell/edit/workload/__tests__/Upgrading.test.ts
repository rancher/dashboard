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

  // TODO: #6179: Integrate test with component fix, as the scope is not to check the value of the input
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip.each([
    ['surge', 'maxSurge', '%'],
    ['unavailable', 'maxUnavailable', '%'],
  ])('should set typed value in %p into %p and unit', (field, key, unit) => {
    const wrapper = mount(Upgrading);
    const input = wrapper.find(`[data-testid="input-policy-${ field }"]`).find('input');
    const newValue = 123;
    const expectation = `${ newValue }${ unit }`;

    input.setValue(newValue);
    input.trigger('blur');

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
