import { mount } from '@vue/test-utils';
import HarvesterEditVolume from '../volume.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: HarvesterEditVolume', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(HarvesterEditVolume, {
      propsData: { validateRequired: true },
      mocks:     {
        $store: {
          getters: {
            'harvester/all': jest.fn(),
            'i18n/t':        jest.fn(),
            'i18n/exists':   jest.fn(),
          }
        },
      }
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-hev-]');

    expect(inputWraps).toHaveLength(4);
  });

  it.each([
    'name',
    'size',
  ])('should emit an update on %p input blur', (field) => {
    const wrapper = mount(HarvesterEditVolume, {
      propsData: { mode: _EDIT, validateRequired: true },
      mocks:     {
        $store: {
          getters: {
            'harvester/all': jest.fn(),
            'i18n/t':        jest.fn(),
            'i18n/exists':   jest.fn(),
          }
        },
      }
    });
    const input = wrapper.find(`[data-testid="input-hev-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);
    input.trigger('blur');

    expect(wrapper.emitted('update')).toHaveLength(1);
  });

  it.each([
    'type',
    'bus'
  ])('should emit an update on %p selection change', async(field) => {
    const wrapper = mount(HarvesterEditVolume, {
      propsData: { mode: _EDIT, validateRequired: true },
      mocks:     {
        $store: {
          getters: {
            'harvester/all': jest.fn(),
            'i18n/t':        jest.fn(),
            'i18n/exists':   jest.fn(),
          }
        },
      }
    });
    const select = wrapper.find(`[data-testid="input-hev-${ field }"]`);

    select.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(wrapper.emitted('update')).toHaveLength(1);
  });
});
