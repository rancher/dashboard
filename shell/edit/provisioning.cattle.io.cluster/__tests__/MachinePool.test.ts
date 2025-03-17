import { shallowMount, Wrapper } from '@vue/test-utils';
import MachinePool from '@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool';
import { MACHINE_POOL_VALIDATION } from '@shell/utils/validators/machine-pool';

describe('component: MachinePool', () => {
  let wrapper: Wrapper<InstanceType<typeof MachinePool>>;

  beforeEach(() => {
    wrapper = shallowMount(MachinePool, { propsData: { value: { pool: {} } } });
  });

  it('adds error when handlePoolName is called with an invalid value', () => {
    wrapper.vm.handlePoolName('');
    expect(wrapper.vm.validationErrors).toContain(MACHINE_POOL_VALIDATION.FIELDS.NAME);
  });

  it('removes error when handlePoolName is called with a valid value', () => {
    wrapper.setData({ validationErrors: [MACHINE_POOL_VALIDATION.FIELDS.NAME] });
    wrapper.vm.handlePoolName('test');
    expect(wrapper.vm.validationErrors).not.toContain(MACHINE_POOL_VALIDATION.FIELDS.NAME);
  });

  it('adds error when handlePoolQuantity is called with an invalid value', () => {
    wrapper.vm.handlePoolQuantity(-1);
    expect(wrapper.vm.validationErrors).toContain(MACHINE_POOL_VALIDATION.FIELDS.QUANTITY);
  });

  it('removes error when handlePoolQuantity is called with a valid value', () => {
    wrapper.setData({ validationErrors: [MACHINE_POOL_VALIDATION.FIELDS.QUANTITY] });
    wrapper.vm.handlePoolQuantity(5);
    expect(wrapper.vm.validationErrors).not.toContain(MACHINE_POOL_VALIDATION.FIELDS.QUANTITY);
  });
});
