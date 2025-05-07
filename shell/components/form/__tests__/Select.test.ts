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

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const label = 'Foo';
    const value = 'foo';
    const ariaDescribedById = 'some-described-by-id';
    const ariaLabelText = 'some-aria-label';

    const wrapper = shallowMount(SelectComponent, {
      props: {
        value,
        options: [
          { label, value },
        ],
      },
      attrs: {
        'aria-describedby': ariaDescribedById,
        'aria-label':       ariaLabelText,
      }
    });

    const labeledSelectContainer = wrapper.find('.unlabeled-select');
    const ariaExpanded = labeledSelectContainer.attributes('aria-expanded');
    const ariaDescribedBy = labeledSelectContainer.attributes('aria-describedby');
    const ariaLabel = labeledSelectContainer.attributes('aria-label');

    const vSelectInput = wrapper.find('.inline');

    expect(ariaExpanded).toBe('false');
    expect(ariaDescribedBy).toBe(ariaDescribedById);
    expect(ariaLabel).toBe(ariaLabelText);

    // make sure it's hardcoded to a "neutral" value so that
    // in the current architecture of the component
    // screen readers won't pick up the default "Select option" aria-label
    // from the library
    expect(vSelectInput.attributes('aria-label')).toBe('-');
  });
});
