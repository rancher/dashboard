import { shallowMount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect.vue';

const ServiceNameSelectComponent = ServiceNameSelect as ReturnType<typeof defineComponent>;

describe('serviceNameSelect.vue', () => {
  let consoleWarn: any;

  // eslint-disable-next-line jest/no-hooks
  beforeAll(() => {
    // eslint-disable-next-line no-console
    consoleWarn = console.warn;
  });

  // eslint-disable-next-line jest/no-hooks
  afterAll(() => {
    // eslint-disable-next-line no-console
    console.warn = consoleWarn;
  });

  it('does not throw a warning in the console', () => {
    jest.spyOn(console, 'warn').mockImplementation();

    shallowMount(
      ServiceNameSelectComponent,
      {
        props: {
          options: [
            {
              label: 'label1',
              value: 'val1',
            },
          ]
        }
      }
    );

    // eslint-disable-next-line no-console
    expect(console.warn).not.toHaveBeenCalled();
  });
});
