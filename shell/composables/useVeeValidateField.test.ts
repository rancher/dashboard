import {
  computed, defineComponent, nextTick, provide, ref
} from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useForm } from 'vee-validate';
import RcSection from '@components/RcSection/RcSection.vue';
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

  describe('reporting to an RcSection', () => {
    const ICON = '[data-testid="rc-section-invalid-fields"]';

    // Collapsing the section validates it, so fields show their errors
    const mountInSection = async(opts: Parameters<typeof createHarness>[0], collapse = true) => {
      const Host = defineComponent({
        components: { RcSection, Field: createHarness(opts) },
        setup() {
          useForm();
        },
        template: `
          <RcSection type="primary" mode="with-header" title="Network" expandable>
            <Field />
          </RcSection>
        `,
      });

      const wrapper = mount(Host);

      if (collapse) {
        await wrapper.find('.section-header').trigger('click');
      }
      await flushPromises();

      return wrapper;
    };

    it('should report a named field that fails validation once the section is validated', async() => {
      const wrapper = await mountInSection({ name: 'subnet', rules: [(v) => (v ? undefined : 'Required')] });

      expect(wrapper.find(ICON).exists()).toBe(true);
    });

    it('should not report an untouched named field that fails validation before the section is validated', async() => {
      const wrapper = await mountInSection({ name: 'subnet', rules: [(v) => (v ? undefined : 'Required')] }, false);

      expect(wrapper.find(ICON).exists()).toBe(false);
    });

    it('should report an untouched named field that fails validation once the form shows all errors', async() => {
      const Host = defineComponent({
        components: { RcSection, Field: createHarness({ name: 'subnet', rules: [(v) => (v ? undefined : 'Required')] }) },
        setup() {
          useForm();
          provide('vee-show-all-errors', ref(true));
        },
        template: `
          <RcSection type="primary" mode="with-header" title="Network" expandable>
            <Field />
          </RcSection>
        `,
      });

      const wrapper = mount(Host);

      await flushPromises();

      expect(wrapper.find(ICON).exists()).toBe(true);
    });

    it('should not report a named field that passes validation', async() => {
      const wrapper = await mountInSection({
        name: 'subnet', value: 'set', rules: [(v) => (v ? undefined : 'Required')]
      });

      expect(wrapper.find(ICON).exists()).toBe(false);
    });

    it('should not report a field without a name', async() => {
      const wrapper = await mountInSection({ name: null, rules: [() => 'Required'] });

      expect(wrapper.find(ICON).exists()).toBe(false);
    });
  });

  describe('showing errors once the RcSection is collapsed', () => {
    const mountInSection = async(opts: Parameters<typeof createHarness>[0]) => {
      const Field = createHarness(opts);
      const Host = defineComponent({
        components: { RcSection, Field },
        setup() {
          useForm();
        },
        template: `
          <RcSection type="primary" mode="with-header" title="Network" expandable>
            <Field />
          </RcSection>
        `,
      });

      const wrapper = mount(Host);

      await flushPromises();

      return { wrapper, field: () => wrapper.findComponent(Field).vm as unknown as { effectiveValidationMessage: unknown; valueRef: unknown } };
    };

    const required = (v: unknown) => (v ? undefined : 'Required');

    it('does not show an untouched error before the section is collapsed', async() => {
      const { field } = await mountInSection({ name: 'subnet', rules: [required] });

      expect(field().effectiveValidationMessage).toBeUndefined();
    });

    it('shows an untouched error once the section is collapsed', async() => {
      const { wrapper, field } = await mountInSection({ name: 'subnet', rules: [required] });

      await wrapper.find('.section-header').trigger('click');

      expect(field().effectiveValidationMessage).toBe('Required');
    });

    it('keeps showing the error after the section is expanded again, until it is corrected', async() => {
      const { wrapper, field } = await mountInSection({ name: 'subnet', rules: [required] });

      await wrapper.find('.section-header').trigger('click');
      await wrapper.find('.section-header').trigger('click');
      expect(field().effectiveValidationMessage).toBe('Required');

      field().valueRef = 'subnet-0abc';
      await flushPromises();
      expect(field().effectiveValidationMessage).toBeUndefined();
    });
  });
});
