import Preferences from '@shell/pages/prefs.vue';
import { shallowMount } from '@vue/test-utils';

describe('page: prefs should', () => {
  it.each([
    ['Fri, May 5 2023', 0],
    ['Fri, 5 May 2023', 1],
    ['5/5/2023 (D/M/YYYY)', 2],
    ['5/5/2023 (M/D/YYYY)', 3],
    ['2023-05-05 (YYYY-MM-DD)', 4],
  ])('format the date optionally with a cue as %p for date 05/05/2023', (expected, index) => {
    const date = '05/05/2023';
    const format = ['ddd, MMM D YYYY', 'ddd, D MMM YYYY', 'D/M/YYYY', 'M/D/YYYY', 'YYYY-MM-DD'];

    jest
      .useFakeTimers()
      .setSystemTime(new Date(date));

    const wrapper = shallowMount(Preferences, {
      props: { value: 'asd' },

      global: {
        mocks: {
          $store: {
            getters: {
              'prefs/options':        () => format,
              'prefs/get':            jest.fn().mockReturnValue('YYYY-MM-DD HH:mm:ss'),
              'management/schemaFor': jest.fn(),
              isSingleProduct:        jest.fn(),
              'i18n/t':               jest.fn(),
            }
          }
        },

        stubs: {
          BackLink:              { template: '<div />' },
          ButtonGroup:           { template: '<div />' },
          LabeledSelect:         { template: '<div />' },
          Checkbox:              { template: '<div />' },
          LandingPagePreference: { template: '<div />' },
          LocaleSelector:        { template: '<div />' },
        },
      },
    });

    const options = (wrapper.vm as unknown as any).dateOptions;

    expect(options[index].label).toBe(expected);
  });

  it.each([
    ['Mon, May 1 2023', 0],
    ['Mon, 1 May 2023', 1],
    ['1/5/2023', 2],
    ['5/1/2023', 3],
    ['2023-05-01', 4],
  ])('format the date %p without cue for date 01/05/2023', (expected, index) => {
    const date = '05/01/2023';
    const format = ['ddd, MMM D YYYY', 'ddd, D MMM YYYY', 'D/M/YYYY', 'M/D/YYYY', 'YYYY-MM-DD'];

    jest
      .useFakeTimers()
      .setSystemTime(new Date(date));

    const wrapper = shallowMount(Preferences, {
      props: { value: 'asd' },

      global: {
        mocks: {
          $store: {
            getters: {
              'prefs/options':        () => format,
              'prefs/get':            jest.fn().mockReturnValue('YYYY-MM-DD HH:mm:ss'),
              'management/schemaFor': jest.fn(),
              isSingleProduct:        jest.fn(),
              'i18n/t':               jest.fn(),
            }
          }
        },

        stubs: {
          BackLink:              { template: '<div />' },
          ButtonGroup:           { template: '<div />' },
          LabeledSelect:         { template: '<div />' },
          Checkbox:              { template: '<div />' },
          LandingPagePreference: { template: '<div />' },
          LocaleSelector:        { template: '<div />' },
        },
      },
    });

    const options = (wrapper.vm as unknown as any).dateOptions;

    expect(options[index].label).toBe(expected);
  });
});
