import {
  defineComponent, h, provide, ref, type Ref
} from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useField, useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import RcInput from './RcInput.vue';
import RcInputPassword from './RcInputPassword.vue';
import RcInputUnit from './RcInputUnit.vue';
import type { RcInputValue } from './types';

const schema = toTypedSchema(z.object({
  name:   z.string().min(1, 'Name is required'),
  token:  z.string().min(8, 'At least 8 characters'),
  memory: z.number({ invalid_type_error: 'Memory must be a number' }).min(4, 'At least 4 MiB'),
}));

type FormContext = ReturnType<typeof useForm>;

// vee-validate debounces schema validation by 5ms
const settle = async() => {
  await new Promise((resolve) => setTimeout(resolve, 20));
  await flushPromises();
};

/**
 * A form in the shape the dashboard uses: a zod schema on useForm, the
 * component owning each value, and each input registered by its name.
 */
const mountForm = ({ showAllErrors = false } = {}) => {
  let form!: FormContext;
  const values = {
    name: ref(''), token: ref('secret'), memory: ref<number | string>(512)
  };

  const Form = defineComponent({
    setup() {
      form = useForm({ validationSchema: schema });
      provide('vee-show-all-errors', ref(showAllErrors));

      return () => h('form', [
        h(RcInput, {
          name: 'name', label: 'Name', modelValue: values.name.value, 'onUpdate:modelValue': (v: RcInputValue) => (values.name.value = v as string)
        }),
        h(RcInputPassword, {
          name: 'token', label: 'Token', modelValue: values.token.value, 'onUpdate:modelValue': (v: RcInputValue) => (values.token.value = v as string)
        }),
        h(RcInputUnit, {
          name:                  'memory',
          label:                 'Memory',
          unit:                  'MiB',
          type:                  'number',
          modelValue:            values.memory.value,
          modelModifiers:        { number: true },
          'onUpdate:modelValue': (v: RcInputValue) => (values.memory.value = v as number),
        }),
      ]);
    },
  });

  const wrapper = mount(Form, { attachTo: document.body });

  return {
    wrapper, form: () => form, values
  };
};

const fieldOf = (wrapper: ReturnType<typeof mount>, name: string) => {
  const input = wrapper.find(`input[name="${ name }"]`);
  const field = wrapper.findAll('.rc-field').find((f) => f.find(`input[name="${ name }"]`).exists())!;

  return {
    input,
    message: () => field.find('.rc-field-validation-message').exists() ? field.find('.rc-field-validation-message').text() : undefined,
  };
};

describe('rcInput with vee-validate', () => {
  describe('registered by name with a useForm schema', () => {
    it('passes the name to the native input', () => {
      const { wrapper } = mountForm();

      expect(fieldOf(wrapper, 'name').input.exists()).toBe(true);
      wrapper.unmount();
    });

    it('registers each named input with the form', async() => {
      const { wrapper, form } = mountForm();

      await settle();

      expect(form().values).toStrictEqual({
        name: '', token: 'secret', memory: 512
      });
      wrapper.unmount();
    });

    it('validates against the schema', async() => {
      const { wrapper, form } = mountForm();

      const result = await form().validate();

      expect(result.errors).toStrictEqual({ name: 'Name is required', token: 'At least 8 characters' });
      wrapper.unmount();
    });

    it('hides a schema error until the input is touched', async() => {
      const { wrapper } = mountForm();

      await settle();

      expect(fieldOf(wrapper, 'name').message()).toBeUndefined();
      wrapper.unmount();
    });

    it('shows a schema error once the input is blurred', async() => {
      const { wrapper } = mountForm();
      const { input, message } = fieldOf(wrapper, 'name');

      await input.trigger('blur');
      await settle();

      expect(message()).toStrictEqual('Name is required');
      expect(input.attributes('aria-invalid')).toStrictEqual('true');
      wrapper.unmount();
    });

    it('clears the error once the value is valid', async() => {
      const { wrapper } = mountForm();
      const { input, message } = fieldOf(wrapper, 'name');

      await input.trigger('blur');
      await input.setValue('my-cluster');
      await settle();

      expect(message()).toBeUndefined();
      expect(input.attributes('aria-invalid')).toBeUndefined();
      wrapper.unmount();
    });

    it('validates the value a modifier produces', async() => {
      const { wrapper, values } = mountForm();
      const { input, message } = fieldOf(wrapper, 'memory');

      await input.setValue('2');
      await input.trigger('blur');
      await settle();

      expect(values.memory.value).toStrictEqual(2);
      expect(message()).toStrictEqual('At least 4 MiB');
      wrapper.unmount();
    });

    it('shows every error on submit', async() => {
      const { wrapper, form } = mountForm();
      const onSubmit = jest.fn();

      await form().handleSubmit(onSubmit)();
      await settle();

      expect(onSubmit).not.toHaveBeenCalled(); // eslint-disable-line jest/prefer-called-with
      expect(fieldOf(wrapper, 'name').message()).toStrictEqual('Name is required');
      expect(fieldOf(wrapper, 'token').message()).toStrictEqual('At least 8 characters');
      wrapper.unmount();
    });

    it('shows every error when vee-show-all-errors is provided', async() => {
      const { wrapper } = mountForm({ showAllErrors: true });

      await settle();

      expect(fieldOf(wrapper, 'name').message()).toStrictEqual('Name is required');
      wrapper.unmount();
    });

    it('submits once the values are valid', async() => {
      const { wrapper, form } = mountForm();
      const onSubmit = jest.fn();

      await fieldOf(wrapper, 'name').input.setValue('my-cluster');
      await fieldOf(wrapper, 'token').input.setValue('long-enough');
      await settle();
      await form().handleSubmit(onSubmit)();

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'my-cluster', token: 'long-enough', memory: 512
      }, expect.anything());
      wrapper.unmount();
    });
  });

  it('does not register an input without a name', async() => {
    let form!: FormContext;
    const Form = defineComponent({
      setup() {
        form = useForm();

        return () => h(RcInput, { modelValue: 'unnamed' });
      },
    });
    const wrapper = mount(Form);

    await settle();

    expect(form.values).toStrictEqual({});
    wrapper.unmount();
  });

  it('works with a field the parent creates with useField', async() => {
    let value!: Ref<string>;
    const Form = defineComponent({
      setup() {
        const field = useField<string>('name', (v: string) => (v ? true : 'Name is required'), { initialValue: '' });

        value = field.value;

        return () => h(RcInput, {
          label:                 'Name',
          modelValue:            field.value.value,
          validationMessage:     field.errorMessage.value,
          'onUpdate:modelValue': (v: RcInputValue) => (field.value.value = v as string),
        });
      },
    });
    const wrapper = mount(Form);

    await wrapper.find('input').setValue('m');
    await wrapper.find('input').setValue('');
    await settle();

    expect(wrapper.find('.rc-field-validation-message').text()).toStrictEqual('Name is required');

    await wrapper.find('input').setValue('my-cluster');
    await settle();

    expect(value.value).toStrictEqual('my-cluster');
    expect(wrapper.find('.rc-field-validation').exists()).toBe(false);
    wrapper.unmount();
  });

  it('prefers a validation-message prop when the schema has no error to show', async() => {
    const Form = defineComponent({
      setup() {
        useForm({ validationSchema: schema });

        return () => h(RcInput, {
          name: 'name', modelValue: 'my-cluster', validationMessage: 'Name is already taken'
        });
      },
    });
    const wrapper = mount(Form);

    await settle();

    expect(wrapper.find('.rc-field-validation-message').text()).toStrictEqual('Name is already taken');
    wrapper.unmount();
  });
});
