import { h } from 'vue';
import { mount } from '@vue/test-utils';
import { RadioGroup } from './index';

describe('component: RadioGroup', () => {
  describe('when disabled', () => {
    it.each([true, false])('should expose disabled slot prop for indexed slots for %p', (disabled) => {
      const wrapper = mount(RadioGroup, {
        propsData: {
          name:    'whatever',
          options: [{ label: 'whatever', value: 'whatever' }],
          disabled
        },
        slots: {
          0: (props: {isDisabled: boolean}) => h('input', {
            id:       'test',
            disabled: props.isDisabled
          })
        }
      });

      const slot = wrapper.find('#test').element as HTMLInputElement;

      expect(slot.disabled).toBe(disabled);
    });
  });

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', async() => {
    const inputLabel = 'some-label';
    const ariaDescribedById = 'some-external-id';
    const currValue = 'whatever';

    const wrapper = mount(RadioGroup, {
      propsData: {
        name:    'some-name',
        label:   inputLabel,
        value:   currValue,
        options: [{ label: currValue, value: currValue }]
      },
      attrs: { 'aria-describedby': ariaDescribedById }
    });

    const field = wrapper.find('[role="radiogroup"]');
    const role = field.attributes('role');
    const ariaLabel = field.attributes('aria-label');
    const ariaDescribedBy = field.attributes('aria-describedby');
    const ariaActiveDescendant = field.attributes('aria-activedescendant');

    expect(ariaLabel).toBe(inputLabel);
    expect(role).toBe('radiogroup');
    expect(ariaActiveDescendant).toBe(`${ wrapper.vm.radioOptionsIdPrefix }0`);
    expect(ariaDescribedBy).toBe(ariaDescribedById);

    const radioOption = wrapper.find(`.radio-custom`);

    // make sure we validate when using RadioGroup without custom slot data
    // we do assign an ID that is important to get 'aria-activedescendant' working
    expect(radioOption.attributes('id')).toBe(`${ wrapper.vm.radioOptionsIdPrefix }0`);
  });

  it('a11y: adding aria-label ($attrs) from parent should override label-based aria-label', async() => {
    const inputLabel = 'some-label';
    const overrideLabel = 'some-override-label';
    const currValue = 'whatever';

    const wrapper = mount(RadioGroup, {
      propsData: {
        name:     'some-name',
        label:    inputLabel,
        value:    currValue,
        disabled: true,
        options:  [{ label: currValue, value: currValue }]
      },
      attrs: { 'aria-label': overrideLabel }
    });

    const field = wrapper.find('[role="radiogroup"]');
    const ariaLabel = field.attributes('aria-label');
    const ariaDisabled = field.attributes('aria-disabled');
    const tabIndex = field.attributes('tabindex');

    expect(ariaLabel).toBe(overrideLabel);
    expect(ariaLabel).not.toBe(inputLabel);
    expect(ariaDisabled).toBe('true');
    expect(tabIndex).toBe('-1');
  });
});
