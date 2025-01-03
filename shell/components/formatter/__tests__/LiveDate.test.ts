import { mount } from '@vue/test-utils';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import dayjs from 'dayjs';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';

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
    const wrapper = mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { global: { mocks: defaultMock } });
    const element = wrapper.find('span');

    expect(element.text()).toBe('-');
  });

  it('should say just now when the time provided is the current time', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      props:  { value: dayjs().toString() },
      global: { mocks: defaultMock }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain('Just now');
  });

  it('should display difference between value and current time', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      props:  { value: Date.now() - 5000 },
      global: { mocks: defaultMock }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain('5 %unit.sec%');
  });

  // this test calls a component method directly: we're testing this because it's how 'live' formatters are used in sortabletable
  it('should recompute and update the displayed value when prompted', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      props:  { value: dayjs().toString() },
      global: { mocks: defaultMock }
    });

    let element = wrapper.find('span');

    expect(element.text()).toContain('Just now');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await wrapper.vm.liveUpdate(Date.now());

    element = wrapper.find('span');
    expect(element.text()).toContain('1 %unit.sec%');
  });

  it('should include ago suffix if enabled', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      props:  { value: Date.now() - 5000, addSuffix: true },
      global: { mocks: defaultMock }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain('5 %unit.sec% ago');
  });

  it.each([
    [86400000, '1 %unit.day%'],
    [82800000, '23 %unit.hour%'],
    [3540000, '59 %unit.min%']
  ])('should use the largest sensible time unit', async(msAgo, displayValue) => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      props:  { value: Date.now() - msAgo },
      global: { mocks: defaultMock }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain(displayValue);
  });
});
