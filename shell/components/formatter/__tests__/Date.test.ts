import { mount } from '@vue/test-utils';
import Date from '@shell/components/formatter/Date.vue';
import dayjs from 'dayjs';

describe('component: Date formatter', () => {
  it.each([
    'ddd, MMM D YYYY',
    'MMM YYYY'
  ])('should use date format pref', async(dateFormat) => {
    const inputTime = dayjs().toString();
    const expectedDate = dayjs(inputTime).format(dateFormat);
    const wrapper = await mount(Date, {
      props:  { value: inputTime, showTime: false },
      global: { mocks: { $store: { getters: { 'prefs/get': () => dateFormat } } } }
    });
    const element = wrapper.find('span');

    expect(element.text()).toBe(expectedDate);
  });

  it.each([
    'h:mm:ss a',
    'hh:mm'
  ])('should use time format pref', async(timeFormat) => {
    const inputTime = dayjs().toString();
    const expectedDate = dayjs(inputTime).format(timeFormat);
    const wrapper = await mount(Date, {
      props:  { value: inputTime, showDate: false },
      global: { mocks: { $store: { getters: { 'prefs/get': () => timeFormat } } } }
    });
    const element = wrapper.find('span');

    expect(element.text()).toBe(expectedDate);
  });

  it.each([
    'div',
    'hr'
  ])('use custom tag provided by tagName prop', async(tagName) => {
    const wrapper = await mount(Date, {
      props:  { value: dayjs().toString(), tagName },
      global: { mocks: { $store: { getters: { 'prefs/get': jest.fn() } } } }
    });
    const element = wrapper.find(tagName);

    expect(element).toBeDefined();
  });

  it.each([
    true,
    false
  ])('should render day and time on different lines if configured', async(multiline) => {
    const wrapper = await mount(Date, {
      props:  { value: dayjs().toString(), multiline },
      global: { mocks: { $store: { getters: { 'prefs/get': jest.fn() } } } }
    });

    expect(wrapper.find('br').exists()).toBe(multiline);
  });
});
