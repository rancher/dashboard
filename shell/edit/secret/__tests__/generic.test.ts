import { defineComponent, h, reactive } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { _CREATE } from '@shell/config/query-params';
import { useFormValidation } from '@shell/composables/useFormValidation';
import Generic from '@shell/edit/secret/generic.vue';

const KeyValueStub = defineComponent({
  name:   'KeyValue',
  props:  { keyErrors: { type: Object, default: () => ({}) } },
  render: () => h('div'),
});

// Renders the data fields inside a parent form, like shell/edit/secret/index.vue does
const mountInForm = (data: Record<string, string>) => {
  const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });
  const value = reactive({ data });
  const FormHost = defineComponent({
    setup() {
      const { isFormValid, veeErrors } = useFormValidation((key: string) => key, []);

      return { isFormValid, veeErrors };
    },
    render: () => h(Generic, { value, mode: _CREATE }),
  });

  const wrapper = mount(FormHost, {
    global: {
      plugins: [store],
      mocks:   { $store: store },
      stubs:   { KeyValue: KeyValueStub },
    }
  });

  return { wrapper, value };
};

describe('component: Generic.vue', () => {
  it.each([
    ['no keys', {}],
    ['valid keys', { 'my-key.json': 'dmFsdWU=', MY_KEY: 'dmFsdWU=' }],
  ])('should keep the form valid with %s', async(_, data) => {
    const { wrapper } = mountInForm(data);

    await flushPromises();

    expect(wrapper.vm.isFormValid).toBe(true);
  });

  it('should invalidate the form when a key has invalid characters', async() => {
    const { wrapper } = mountInForm({ valid: 'dmFsdWU=', '@##$': 'dmFsdWU=' });

    await flushPromises();

    expect(wrapper.vm.veeErrors).toStrictEqual({ data: expect.stringContaining('validation.dataKey') });
  });

  it('should pass only the invalid keys to KeyValue', async() => {
    const { wrapper } = mountInForm({ valid: 'dmFsdWU=', '@##$': 'dmFsdWU=' });

    await flushPromises();

    expect(Object.keys(wrapper.findComponent(KeyValueStub).props('keyErrors') || {})).toStrictEqual(['@##$']);
  });

  it('should revalidate when the keys change', async() => {
    const { wrapper, value } = mountInForm({ '@##$': 'dmFsdWU=' });

    await flushPromises();
    value.data = { fixed: 'dmFsdWU=' };
    await flushPromises();

    expect(wrapper.vm.isFormValid).toBe(true);
  });
});
