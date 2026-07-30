import { mount } from '@vue/test-utils';
import LabeledSelectWithCreate from '@shell/components/form/LabeledSelectWithCreate.vue';

const LabeledSelectStub = {
  name:  'LabeledSelect',
  props: [
    'value', 'label', 'placeholder', 'options', 'mode', 'loading',
    'disabled', 'clearable', 'rules', 'appendToBody', 'requireDirty',
    'required', 'searchable',
  ],
  emits:    ['selecting', 'update:value'],
  template: '<div class="labeled-select-stub" />',
};

jest.mock('@components/Form/LabeledInput', () => ({
  LabeledInput: {
    name:  'LabeledInput',
    props: ['value', 'label', 'placeholder', 'mode', 'rules'],
    emits: ['update:value'],

    template: `
      <div class="labeled-input-stub">
        <input :value="value" @input="$emit('update:value', $event.target.value)" />
        <slot name="suffix" />
      </div>
    `,
    methods: { focus() {} }, // the real component exposes this for the parent's nextTick(() => inputRef.value?.focus())
  },
}));

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key) => key }) }));

const CREATE_OPTIONS = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
];

function mountComponent(props = {}) {
  return mount(LabeledSelectWithCreate, {
    props: {
      value:   null,
      options: CREATE_OPTIONS,
      label:   'Test Label',
      ...props,
    },
    global: {
      stubs: { LabeledSelect: LabeledSelectStub },
      mocks: { t: (key: string) => key },
    },
  });
}

function findSelect(wrapper) {
  return wrapper.findComponent(LabeledSelectStub);
}

function findInput(wrapper) {
  return wrapper.findComponent({ name: 'LabeledInput' });
}

describe('component: LabeledSelectWithCreate', () => {
  describe('select mode (default)', () => {
    it('renders the LabeledSelect and not the create input', () => {
      const wrapper = mountComponent();

      expect(findSelect(wrapper).exists()).toBe(true);
      expect(findInput(wrapper).exists()).toBe(false);
    });

    it('prepends a highlighted "create" entry and a divider before the passed-in options by default', () => {
      const wrapper = mountComponent();

      expect(findSelect(wrapper).props('options')).toEqual([
        {
          label: 'Create new…', value: '__create__', kind: 'highlighted',
        },
        {
          label: 'divider', disabled: true, kind: 'divider',
        },
        ...CREATE_OPTIONS,
      ]);
    });

    it('uses the custom createLabel prop for the create entry label', () => {
      const wrapper = mountComponent({ createLabel: 'Add a new thing' });

      expect(findSelect(wrapper).props('options')[0].label).toBe('Add a new thing');
    });

    it('does not add the create entry or divider when createAllowed is false', () => {
      const wrapper = mountComponent({ createAllowed: false });

      expect(findSelect(wrapper).props('options')).toEqual(CREATE_OPTIONS);
    });

    it('prefers labelKey (translated) over label when both are provided', () => {
      const wrapper = mountComponent({ labelKey: 'some.translation.key', label: 'Raw Label' });

      expect(findSelect(wrapper).props('label')).toBe('some.translation.key');
    });

    it('falls back to the raw label when labelKey is not set', () => {
      const wrapper = mountComponent({ label: 'Raw Label' });

      expect(findSelect(wrapper).props('label')).toBe('Raw Label');
    });

    it('passes through the remaining select props unchanged', () => {
      const wrapper = mountComponent({
        placeholder:  'Pick one',
        mode:         'edit',
        loading:      true,
        disabled:     true,
        clearable:    true,
        appendToBody: true,
        requireDirty: false,
        required:     true,
      });

      expect(findSelect(wrapper).props()).toMatchObject({
        value:        null,
        placeholder:  'Pick one',
        mode:         'edit',
        loading:      true,
        disabled:     true,
        clearable:    true,
        appendToBody: true,
        requireDirty: false,
        required:     true,
        searchable:   true,
      });
    });

    it('emits update:value when the select emits update:value with a normal option', async() => {
      const wrapper = mountComponent();

      await findSelect(wrapper).vm.$emit('update:value', 'a');

      expect(wrapper.emitted('update:value')).toEqual([['a']]);
    });

    it('does not emit update:value when the select reports the create sentinel value', async() => {
      const wrapper = mountComponent();

      await findSelect(wrapper).vm.$emit('update:value', '__create__');

      expect(wrapper.emitted('update:value')).toBeFalsy();
    });

    it('switches to create mode and emits "creating" when the create option is selected', async() => {
      const wrapper = mountComponent();

      await findSelect(wrapper).vm.$emit('selecting', { label: 'Create new…', value: '__create__' });
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('creating')).toBeTruthy();
      expect(findSelect(wrapper).exists()).toBe(false);
      expect(findInput(wrapper).exists()).toBe(true);
    });

    it('switches to create mode when "selecting" fires with no option (e.g. clearing)', async() => {
      const wrapper = mountComponent();

      await findSelect(wrapper).vm.$emit('selecting', null);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('creating')).toBeTruthy();
      expect(findInput(wrapper).exists()).toBe(true);
    });

    it('does not switch to create mode when a regular option is selected', async() => {
      const wrapper = mountComponent();

      await findSelect(wrapper).vm.$emit('selecting', { label: 'Option A', value: 'a' });
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('creating')).toBeFalsy();
      expect(findInput(wrapper).exists()).toBe(false);
    });
  });

  describe('create mode', () => {
    async function mountInCreateMode(props = {}) {
      const wrapper = mountComponent(props);

      await findSelect(wrapper).vm.$emit('selecting', { value: '__create__' });
      await wrapper.vm.$nextTick();

      return wrapper;
    }

    it('renders a LabeledInput with the createPlaceholder and label, and hides the select', async() => {
      const wrapper = await mountInCreateMode({
        createPlaceholder: 'Type a new value',
        label:             'Test Label',
      });
      const input = findInput(wrapper);

      expect(input.exists()).toBe(true);
      expect(input.props('placeholder')).toBe('Type a new value');
      expect(input.props('label')).toBe('Test Label');
      expect(findSelect(wrapper).exists()).toBe(false);
    });

    it('starts with an empty new-value input', async() => {
      const wrapper = await mountInCreateMode();

      expect(findInput(wrapper).props('value')).toBe('');
    });

    it('emits update:value immediately on every keystroke, with no separate confirm step', async() => {
      const wrapper = await mountInCreateMode();

      await findInput(wrapper).vm.$emit('update:value', 'N');
      await findInput(wrapper).vm.$emit('update:value', 'Ne');
      await findInput(wrapper).vm.$emit('update:value', 'New');

      expect(wrapper.emitted('update:value')).toEqual([['N'], ['Ne'], ['New']]);
      // typing never auto-confirms/returns to select mode - only cancel does
      expect(findInput(wrapper).exists()).toBe(true);
      expect(findSelect(wrapper).exists()).toBe(false);
    });

    it('reflects the last emitted value back into the input value prop', async() => {
      const wrapper = await mountInCreateMode();

      await findInput(wrapper).vm.$emit('update:value', 'New Item');
      await wrapper.vm.$nextTick();

      expect(findInput(wrapper).props('value')).toBe('New Item');
    });

    it('does not render a confirm/add button', async() => {
      const wrapper = await mountInCreateMode();

      expect(wrapper.find('.confirm-create').exists()).toBe(false);
    });

    it('cancels creation, clears the new value, emits "cancel", and returns to select mode when the cancel button is clicked', async() => {
      const wrapper = await mountInCreateMode();

      await findInput(wrapper).vm.$emit('update:value', 'Abandoned');
      await wrapper.vm.$nextTick();
      await wrapper.find('button').trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('cancel')).toBeTruthy();
      expect(findInput(wrapper).exists()).toBe(false);
      expect(findSelect(wrapper).exists()).toBe(true);

      // Re-entering create mode should start from a cleared value.
      await findSelect(wrapper).vm.$emit('selecting', { value: '__create__' });
      await wrapper.vm.$nextTick();
      expect(findInput(wrapper).props('value')).toBe('');
    });

    it('cancels creation when Escape is pressed in the input', async() => {
      const wrapper = await mountInCreateMode();

      await findInput(wrapper).trigger('keyup.escape');

      expect(wrapper.emitted('cancel')).toBeTruthy();
      expect(findInput(wrapper).exists()).toBe(false);
    });

    it('passes mode and rules through to the create-mode LabeledInput', async() => {
      const rules = [(val) => (!val ? 'Required' : undefined)];
      const wrapper = await mountInCreateMode({ mode: 'edit', rules });
      const input = findInput(wrapper);

      expect(input.props('mode')).toBe('edit');
      expect(input.props('rules')).toStrictEqual(rules);
    });
  });
});
