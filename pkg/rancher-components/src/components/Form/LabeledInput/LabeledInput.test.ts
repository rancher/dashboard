
import { mount } from '@vue/test-utils';
import { LabeledInput } from './index';

describe('component: LabeledInput', () => {
  it('should emit input only once', () => {
    const value = '2';
    const delay = 1;
    const wrapper = mount(LabeledInput, { 
      propsData: { delay },
      mocks:      {
        $store: {
          getters: {
            'i18n/t': jest.fn()
          }
        }
      }
    });

    jest.useFakeTimers();
    wrapper.find('input').setValue('1');
    wrapper.find('input').setValue(value);
    jest.advanceTimersByTime(delay);
    jest.useRealTimers();

    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('input')![0][0]).toBe(value);
  });
});
