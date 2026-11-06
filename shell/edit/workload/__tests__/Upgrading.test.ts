import { mount } from '@vue/test-utils';
import Upgrading from '@shell/edit/workload/Upgrading.vue';
import { WORKLOAD_TYPES } from '@shell/config/types';

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
    WORKLOAD_TYPES.REPLICA_SET,
    WORKLOAD_TYPES.REPLICATION_CONTROLLER,
  ])('should persist minReadySeconds into value for %p', async(type) => {
    const wrapper = mount(Upgrading, { props: { type } });
    const input = wrapper.find('[data-testid="input-policy-min"]').find('input');
    const newValue = 123;

    await input.setValue(newValue);
    await input.trigger('blur');

    expect(wrapper.props('value')?.minReadySeconds).toBe(newValue);
  });

  it.each([
    ['maxSurge', '%'],
    ['maxUnavailable', '%'],
  ] as const)('should set typed value in %p with %p unit', (key, unit) => {
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

  describe('daemonSet', () => {
    const type = WORKLOAD_TYPES.DAEMON_SET;

    it('should display maxSurge and maxUnavailable inputs', () => {
      const wrapper = mount(Upgrading, { props: { type } });

      expect(wrapper.find('[data-testid="input-policy-surge"]').findAllComponents({ name: 'InputWithSelect' })).toHaveLength(2);
    });

    it.each([
      [10, 0],
      ['30%', 0],
    ])('should keep maxSurge %p and maxUnavailable %p when another field changes', (maxSurge, maxUnavailable) => {
      const value = { updateStrategy: { type: 'RollingUpdate', rollingUpdate: { maxSurge, maxUnavailable } } };
      const wrapper = mount(Upgrading, { props: { type, value } });

      wrapper.vm.minReadySeconds = 5;
      wrapper.vm.update();

      expect(wrapper.props('value')?.minReadySeconds).toBe(5);
      expect(wrapper.props('value')?.updateStrategy.rollingUpdate).toStrictEqual({ maxSurge, maxUnavailable });
    });

    it('should default maxSurge to 0 when there is no updateStrategy', () => {
      const wrapper = mount(Upgrading, { props: { type, value: {} } });

      wrapper.vm.update();

      expect(wrapper.props('value')?.updateStrategy.rollingUpdate.maxSurge).toBe(0);
    });

    it('should set typed maxSurge into updateStrategy', () => {
      const wrapper = mount(Upgrading, { props: { type, value: {} } });

      wrapper.vm.updateWithUnits({ selected: 'Pods', text: 3 }, 'maxSurge');

      expect(wrapper.props('value')?.updateStrategy.rollingUpdate.maxSurge).toBe(3);
    });
  });
});
