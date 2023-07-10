import { mount } from '@vue/test-utils';
import RegistryMirrors from '@shell/edit/provisioning.cattle.io.cluster/RegistryMirrors.vue';

describe('component: RegistryMirrors', () => {
  it('should set keyPlaceholder, value-placeholder and value-protip prop', () => {
    const mockT = jest.fn();

    mount(RegistryMirrors, {
      propsData: {
        value: { spec: { rkeConfig: {} } },
        mode:  'edit'
      },
      mocks:      { t: mockT },
      directives: { cleanTooltip: jest.fn() }
    });

    expect(mockT).toHaveBeenCalledWith('registryMirror.keyPlaceholder');
    expect(mockT).toHaveBeenCalledWith('registryMirror.valuePlaceholder');
    expect(mockT).toHaveBeenCalledWith('registryMirror.valueProtip');
  });
});
