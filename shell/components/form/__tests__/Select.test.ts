import { shallowMount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import Select from '@shell/components/form/Select.vue';

const SelectComponent = Select as ReturnType<typeof defineComponent>;

describe('select.vue', () => {
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

    shallowMount(SelectComponent);

    // eslint-disable-next-line no-console
    expect(console.warn).not.toHaveBeenCalled();
  });
});
