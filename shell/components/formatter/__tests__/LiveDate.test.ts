import { mount } from '@vue/test-utils';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import dayjs from 'dayjs';

const defaultMock = {
  $store: {
    getters: {
      'prefs/get':   jest.fn(),
      'i18n/t':      ( unitKey: string, { count }: any) => unitKey.split('.')[1] + (count > 1 ? 's' : ''),
      'i18n/exists': () => false,

    }
  },
};

describe('component: LiveDate', () => {
  it('should show a dash if no date is provided', () => {
    const wrapper = mount(LiveDate, { mocks: defaultMock });
    const element = wrapper.find('span');

    expect(element.text()).toBe('-');
  });

  it('should say just now when the time provided is the current time', async() => {
    const wrapper = await mount(LiveDate, {
      mocks:     defaultMock,
      propsData: { value: dayjs().toString() }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain('Just now');
  });

  it('should display difference between value and current time', async() => {
    const wrapper = await mount(LiveDate, { mocks: defaultMock, propsData: { value: Date.now() - 5000 } });

    const element = wrapper.find('span');

    expect(element.text()).toContain('5 secs');
  });

  it('should include ago suffix if enabled', async() => {
    const wrapper = await mount(LiveDate, { mocks: defaultMock, propsData: { value: Date.now() - 5000, addSuffix: true } });

    const element = wrapper.find('span');

    expect(element.text()).toContain('5 secs ago');
  });

  it('should use the largest sensible time unit', async() => {
    const oneDay = 86400000;
    const twentyThreeHours = 82800000;

    const wrapper = await mount(LiveDate, {
      mocks:     defaultMock,
      propsData: { value: Date.now() - oneDay }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain('1 day');

    await wrapper.setProps({ value: Date.now() - twentyThreeHours });

    expect(element.text()).toContain('23 hours');
  });
});
