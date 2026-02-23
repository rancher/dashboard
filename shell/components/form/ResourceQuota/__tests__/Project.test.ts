import { shallowMount } from '@vue/test-utils';
import Project from '@shell/components/form/ResourceQuota/Project.vue';
import { TYPES } from '@shell/components/form/ResourceQuota/shared';

describe('project', () => {
  const defaultProps = {
    mode:  'create',
    value: {
      spec: {
        resourceQuota:                 { limit: {} },
        namespaceDefaultResourceQuota: { limit: {} }
      }
    },
    types: []
  };

  it('should emit validationChanged with false when validateTypes(false) is called (e.g., when adding a row)', () => {
    const wrapper: any = shallowMount(Project, { props: defaultProps });

    wrapper.vm.validateTypes(false);

    expect(wrapper.emitted('validationChanged')).toBeTruthy();
    expect(wrapper.emitted('validationChanged')[0]).toStrictEqual([false]);
  });

  it('should emit validationChanged with false if an extended type has no resource identifier', () => {
    const wrapper: any = shallowMount(Project, { props: defaultProps });

    wrapper.setData({ typeValues: [TYPES.EXTENDED] });

    wrapper.vm.validateTypes(true);

    expect(wrapper.emitted('validationChanged')).toBeTruthy();
    expect(wrapper.emitted('validationChanged')[0]).toStrictEqual([false]);
  });

  it('should emit validationChanged with true if an extended type has resource identifier', () => {
    const wrapper: any = shallowMount(Project, { props: defaultProps });

    wrapper.setData({ typeValues: ['extended.my-resource'] });

    wrapper.vm.validateTypes(true);

    expect(wrapper.emitted('validationChanged')).toBeTruthy();
    expect(wrapper.emitted('validationChanged')[0]).toStrictEqual([true]);
  });

  it('should update typeValues and validate when updateResourceIdentifier is called', () => {
    const wrapper: any = shallowMount(Project, { props: defaultProps });

    wrapper.setData({ typeValues: [TYPES.EXTENDED] });

    wrapper.vm.updateResourceIdentifier({
      type:       TYPES.EXTENDED,
      customType: 'my-resource',
      index:      0
    });

    expect(wrapper.vm.typeValues[0]).toStrictEqual('extended.my-resource');
    expect(wrapper.emitted('validationChanged')).toBeTruthy();
    expect(wrapper.emitted('validationChanged')[0]).toStrictEqual([true]);
  });
});
