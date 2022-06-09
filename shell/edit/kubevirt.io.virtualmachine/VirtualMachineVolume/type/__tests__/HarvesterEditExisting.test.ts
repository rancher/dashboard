import { mount } from '@vue/test-utils';
import HarvesterEditExisting from '@shell/edit/kubevirt.io.virtualmachine/VirtualMachineVolume/type/existing.vue';
import { _EDIT } from '@shell/config/query-params';
import vSelect, { VueSelectMethods } from 'vue-select';

describe('component: HarvesterEditExisting', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(HarvesterEditExisting, {
      propsData: {
        mode: _EDIT, value: {}, rows: []
      },
      mocks:      {
        $store: {
          getters: {
            'harvester/all': () => [],
            'i18n/t':        jest.fn()
          }
        }
      }
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-hee-]');

    expect(inputWraps).toHaveLength(5);
  });

  it.each([
    'name',
  ])('should emit an update on %p input', (field) => {
    const wrapper = mount(HarvesterEditExisting, {
      propsData: {
        mode: _EDIT, value: {}, rows: []
      },
      mocks:      {
        $store: {
          getters: {
            'harvester/all': () => [],
            'i18n/t':        jest.fn()
          }
        }
      }
    });
    const input = wrapper.find(`[data-testid="input-hee-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);

    expect(wrapper.emitted('update')).toHaveLength(1);
  });

  // TODO: Restore this test when the input is allowed to edit
  it.skip.each([
    'size',
  ])('should emit an update on %p input and blur', (field) => {
    const wrapper = mount(HarvesterEditExisting, {
      propsData: {
        mode: _EDIT, value: {}, rows: []
      },
      mocks:      {
        $store: {
          getters: {
            'harvester/all': () => [],
            'i18n/t':        jest.fn()
          }
        }
      }
    });
    const input = wrapper.find(`[data-testid="input-hee-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);
    input.trigger('blur');

    expect(wrapper.emitted('input')).toHaveLength(1);
  });

  it.each([
    'type',
    'volumeName',
    'bus',
  ])('should emit an update on %p selection change', (field) => {
    const wrapper = mount(HarvesterEditExisting, {
      propsData: {
        mode: _EDIT, value: {}, rows: []
      },
      mocks:      {
        $store: {
          getters: {
            'harvester/all': () => [],
            'i18n/t':        jest.fn()
          }
        }
      }
    });
    const select = wrapper
      .find(`[data-testid="input-hee-${ field }"]`)
      .find(vSelect);

    // Component is not in Typescript
    (select.vm as any as VueSelectMethods).select('whatever');

    expect(wrapper.emitted('update')).toHaveLength(1);
  });
});
