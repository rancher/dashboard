import {
  computed, defineComponent, nextTick, provide, ref
} from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useVeeValidateField } from './useVeeValidateField';

function createHarness(opts: {
  name?: string | null;
  rules?: Array<(v: unknown) => string | undefined>;
  value?: unknown;
  validationMessage?: string;
  showAllErrors?: boolean;
}) {
  return defineComponent({
    setup() {
      const nameRef = ref(opts.name ?? null);
      const rulesRef = ref(opts.rules ?? []);
      const valueRef = ref(opts.value ?? '');
      const validationMessageRef = computed(() => opts.validationMessage);

      if (opts.showAllErrors) {
        provide('vee-show-all-errors', ref(true));
      }

      const result = useVeeValidateField({
        name:              nameRef,
        rules:             rulesRef,
        value:             valueRef,
        validationMessage: validationMessageRef,
      });

      return {
        ...result,
        nameRef,
        valueRef,
      };
    },
    template: '<div />',
  });
}

describe('useVeeValidateField', () => {
  describe('without a name prop', () => {
    it('falls back to the passed validationMessage', async() => {
      const errorMessage = 'This field is required';
      const wrapper = mount(createHarness({
        name:              null,
        validationMessage: errorMessage,
      }));

      await flushPromises();

      expect(wrapper.vm.effectiveValidationMessage).toBe(errorMessage);
    });

    it('does not run rules through vee-validate', async() => {
      const rule = jest.fn(() => 'error');
      const wrapper = mount(createHarness({
        name:  null,
        rules: [rule],
        value: '',
      }));

      await flushPromises();

      expect(wrapper.vm.effectiveValidationMessage).toBeUndefined();
    });
  });

  describe('with a name prop', () => {
    it('does not show error before the field is touched', async() => {
      const errorMessage = 'Cannot be empty';
      const wrapper = mount(createHarness({
        name:  'testField',
        rules: [(v) => (!v ? errorMessage : undefined)],
        value: '',
      }));

      await flushPromises();

      expect(wrapper.vm.effectiveValidationMessage).toBeUndefined();
    });

    it('shows vee-validate error after veeHandleBlur + veeValidate', async() => {
      const errorMessage = 'Cannot be empty';
      const wrapper = mount(createHarness({
        name:  'testField',
        rules: [(v) => (!v ? errorMessage : undefined)],
        value: '',
      }));

      wrapper.vm.veeHandleBlur(undefined, false);
      await wrapper.vm.veeValidate();
      await flushPromises();

      expect(wrapper.vm.effectiveValidationMessage).toBe(errorMessage);
    });

    it('shows error without touch when showAllErrors is injected as true', async() => {
      const errorMessage = 'Cannot be empty';
      const showAllErrors = ref(false);

      const inner = defineComponent({
        setup() {
          const nameRef = ref('testField');
          const rulesRef = ref([(v: unknown) => (!v ? errorMessage : undefined)]);
          const valueRef = ref('');
          const validationMessageRef = computed(() => undefined as string | undefined);

          return useVeeValidateField({
            name:              nameRef,
            rules:             rulesRef,
            value:             valueRef,
            validationMessage: validationMessageRef,
          });
        },
        template: '<div />',
      });

      const outer = defineComponent({
        components: { inner },
        setup() {
          provide('vee-show-all-errors', showAllErrors);
        },
        template: '<inner ref="innerRef" />',
      });

      const wrapper = mount(outer);
      const innerVm = wrapper.getComponent(inner);

      await flushPromises();
      expect(innerVm.vm.effectiveValidationMessage).toBeUndefined();

      showAllErrors.value = true;
      await nextTick();

      expect(innerVm.vm.effectiveValidationMessage).toBe(errorMessage);
    });

    it('clears vee-validate error when value becomes valid', async() => {
      const errorMessage = 'Cannot be empty';
      const wrapper = mount(createHarness({
        name:  'testField',
        rules: [(v) => (!v ? errorMessage : undefined)],
        value: '',
      }));

      wrapper.vm.veeHandleBlur(undefined, false);
      await wrapper.vm.veeValidate();
      await flushPromises();
      expect(wrapper.vm.effectiveValidationMessage).toBe(errorMessage);

      wrapper.vm.valueRef = 'some value';
      await flushPromises();

      expect(wrapper.vm.effectiveValidationMessage).toBeUndefined();
    });
  });
});
