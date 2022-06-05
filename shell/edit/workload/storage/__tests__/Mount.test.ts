import { mount } from '@vue/test-utils';
import Mount from '@shell/edit//workload/storage/Mount.vue';

describe('component: Mount', () => {
  it('should display alway at least 1 mount point input', () => {
    const wrapper = mount(Mount, {
      propsData: { container: {} },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } },
    });
    const inputElement = wrapper.find('input').element as HTMLInputElement;

    expect(inputElement.value).toBe('');
  });

  it('should display only values for the current name', () => {
    const name = 'test';
    const wrapper = mount(Mount, {
      propsData: {
        name,
        container: {
          volumeMounts: [
            {
              name,
              mountPath: ''
            },
            {
              name:      'another name',
              mountPath: ''
            },
          ]
        }
      },
      mocks: { $store: { getters: { 'i18n/t': jest.fn() } } },
    });

    const inputs = wrapper.findAll('[id^="mount-path-"]');

    expect(inputs).toHaveLength(1);
  });

  it('should add the new mount point', async() => {
    const name = 'test';
    const wrapper = mount(Mount, {
      propsData: { name, container: {} },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } },
    });

    await wrapper.find('#add-mount').trigger('click');

    const inputs = wrapper.findAll('[id^="mount-path-"]');

    expect(inputs).toHaveLength(2);
  });

  it('should remove the mount point', async() => {
    const name = 'test';
    const wrapper = mount(Mount, {
      propsData: { name, container: {} },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } },
    });

    await wrapper.find('#remove-mount').trigger('click');
    const inputs = wrapper.findAll('[id^="mount-path-"]');

    expect(inputs).toHaveLength(0);
  });

  it('should map the mount point with the new name', async() => {
    const name = 'test';
    const mountPath = './';
    const wrapper = mount(Mount, {
      propsData: { name, container: {} },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } },
    });

    await wrapper.find('[id^="mount-path-"]').setValue(mountPath);
    const result = wrapper.props('container');

    expect(result).toStrictEqual({ volumeMounts: [{ name, mountPath }] });
  });

  it('should not wipe out mounted points on name change', async() => {
    const name = 'test';
    const newName = 'test';
    const mountPath = './';
    const wrapper = mount(Mount, {
      propsData: { name, container: { volumeMounts: [{ name, mountPath }] } },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } },
    });

    await wrapper.setProps({ name: newName });
    const result = wrapper.props('container');
    const inputElement = wrapper.find('input').element as HTMLInputElement;

    expect(result).toStrictEqual({ volumeMounts: [{ name: newName, mountPath }] });
    expect(inputElement.value).toBe(mountPath);
  });
});
