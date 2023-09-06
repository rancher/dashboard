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
    const wrapper = mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { mocks: defaultMock });
    const element = wrapper.find('span');

    expect(element.text()).toBe('-');
  });

  it('should say just now when the time provided is the current time', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      mocks:     defaultMock,
      propsData: { value: dayjs().toString() }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain('Just now');
  });

  it('should display difference between value and current time', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { mocks: defaultMock, propsData: { value: Date.now() - 5000 } });

    const element = wrapper.find('span');

    expect(element.text()).toContain('5 secs');
  });

  // this test calls a component method directly: we're testing this because it's how 'live' formatters are used in sortabletable
  it('should recompute and update the displayed value when prompted', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      mocks:     defaultMock,
      propsData: { value: dayjs().toString() }
    });

    let element = wrapper.find('span');

    expect(element.text()).toContain('Just now');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await wrapper.vm.liveUpdate(Date.now());

    element = wrapper.find('span');
    expect(element.text()).toContain('1 sec');
  });

  it('should include ago suffix if enabled', async() => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { mocks: defaultMock, propsData: { value: Date.now() - 5000, addSuffix: true } });

    const element = wrapper.find('span');

    expect(element.text()).toContain('5 secs ago');
  });

  it.each([
    [86400000, '1 day'],
    [82800000, '23 hours'],
    [3540000, '59 mins']
  ])('should use the largest sensible time unit', async(msAgo, displayValue) => {
    const wrapper = await mount(LiveDate as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      mocks:     defaultMock,
      propsData: { value: Date.now() - msAgo }
    });

    const element = wrapper.find('span');

    expect(element.text()).toContain(displayValue);
  });
});
