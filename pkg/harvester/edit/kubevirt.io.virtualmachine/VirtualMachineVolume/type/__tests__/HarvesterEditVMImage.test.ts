import { mount } from '@vue/test-utils';
import HarvesterEditVMImage from '../vmImage.vue';
import { _CREATE } from '@shell/config/query-params';

describe('component: HarvesterEditVMImage', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(HarvesterEditVMImage, {
      propsData: {
        mode:             _CREATE,
        isVirtualType:    false,
        newCreateId:      '123',
        validateRequired: true,
        idx:              1
      },
      mocks: {
        $store: {
          getters: {
            'harvester/all': jest.fn(),
            'i18n/t':        jest.fn(),
          }
        },
      }
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-hevi-]');

    expect(inputWraps).toHaveLength(5);
  });

  it.each([
    'name',
  ])('should emit an update on %p input', (field) => {
    const wrapper = mount(HarvesterEditVMImage, {
      propsData: {
        mode:             _CREATE,
        isVirtualType:    false,
        newCreateId:      '123',
        validateRequired: true,
        idx:              1
      },
      mocks: {
        $store: {
          getters: {
            'harvester/all': jest.fn(),
            'i18n/t':        jest.fn(),
          }
        },
      }
    });
    const input = wrapper.find(`[data-testid="input-hevi-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);

    expect(wrapper.emitted('update')).toHaveLength(1);
  });

  it.each([
    'size',
  ])('should emit an update on %p input blur', (field) => {
    const wrapper = mount(HarvesterEditVMImage, {
      propsData: {
        mode:             _CREATE,
        isVirtualType:    false,
        newCreateId:      '123',
        validateRequired: true,
        idx:              1
      },
      mocks: {
        $store: {
          getters: {
            'harvester/all': jest.fn(),
            'i18n/t':        jest.fn(),
          }
        },
      }
    });
    const input = wrapper.find(`[data-testid="input-hevi-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);
    input.trigger('blur');

    expect(wrapper.emitted('update')).toHaveLength(1);
  });

  it.each([
    'type',
    'image',
    'bus',
  ])('should emit an update on %p selection change', async(field) => {
    const wrapper = mount(HarvesterEditVMImage, {
      propsData: {
        mode:             _CREATE,
        isVirtualType:    false,
        newCreateId:      '123',
        validateRequired: true,
        idx:              1
      },
      mocks: {
        $store: {
          getters: {
            'harvester/all': jest.fn(),
            'i18n/t':        jest.fn(),
          }
        },
      }
    });
    const select = wrapper.find(`[data-testid="input-hevi-${ field }"]`);

    select.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(wrapper.emitted('update')).toHaveLength(1);
  });
});
