import { shallowMount, mount } from '@vue/test-utils';
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

  it('pressing space key while focused on search should not prevent event propagation', async() => {
    const value = 'value-1';
    const options = [
      { label: 'label-1', value: 'value-1' },
      { label: 'label-2', value: 'value-2' },
    ];

    const wrapper = mount(SelectComponent, {
      props: {
        value,
        label:      'some-label',
        options,
        searchable: true
      }
    });

    const mockEvent = { preventDefault: jest.fn() };
    const spyFocus = jest.spyOn(wrapper.vm, 'focusSearch');
    const spyPreventDefault = jest.spyOn(mockEvent, 'preventDefault');

    const input = wrapper.find('.unlabeled-select');

    // open unlabeled-select first
    await input.trigger('keydown.enter');

    // mimic pressing space on search box inside v-select
    await input.trigger('keydown.space', mockEvent);

    // eslint-disable-next-line
    expect(spyFocus).toHaveBeenCalled();
    expect(spyPreventDefault).not.toHaveBeenCalled();
  });
});
