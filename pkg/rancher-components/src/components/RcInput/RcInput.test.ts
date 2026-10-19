import { h } from 'vue';
import { mount } from '@vue/test-utils';
import RcInput from './RcInput.vue';
import RcFieldGroup from '@components/RcField/RcFieldGroup.vue';

type MountOptions = Parameters<typeof mount>[1];

const mountInput = (props: Record<string, unknown> = {}, options: MountOptions = {}) => mount(RcInput, { ...options, props });

let wrapper: ReturnType<typeof mount>;

describe('component: RcInput', () => {
  describe('value', () => {
    it('renders the model value', () => {
      wrapper = mountInput({ modelValue: 'rancher' });

      expect((wrapper.find('input').element as HTMLInputElement).value).toStrictEqual('rancher');
    });

    it('emits the typed value', async() => {
      wrapper = mountInput({ modelValue: '' });

      await wrapper.find('input').setValue('fleet');

      expect(wrapper.emitted('update:modelValue')).toStrictEqual([['fleet']]);
    });

    it('applies the number modifier', async() => {
      wrapper = mountInput({ modelValue: 0, modelModifiers: { number: true } });

      await wrapper.find('input').setValue('42');

      expect(wrapper.emitted('update:modelValue')).toStrictEqual([[42]]);
    });
  });

  describe('attributes', () => {
    it('passes attributes to the native input', () => {
      wrapper = mountInput({}, {
        attrs: {
          name: 'cluster-name', autocomplete: 'off', maxlength: '63', 'data-testid': 'cluster-name'
        }
      });
      const input = wrapper.find('input');

      expect(input.attributes('name')).toStrictEqual('cluster-name');
      expect(input.attributes('autocomplete')).toStrictEqual('off');
      expect(input.attributes('maxlength')).toStrictEqual('63');
      expect(input.attributes('data-testid')).toStrictEqual('cluster-name');
    });

    it('puts class and style on the field rather than the input', () => {
      wrapper = mountInput({}, { attrs: { class: 'custom', style: 'width: 200px;' } });

      expect(wrapper.classes()).toContain('custom');
      expect(wrapper.attributes('style')).toStrictEqual('width: 200px;');
      expect(wrapper.find('input').attributes('class')).not.toContain('custom');
    });

    it('joins a given aria-describedby with the field\'s own', () => {
      wrapper = mountInput({ id: 'name', helperText: 'Help' }, { attrs: { 'aria-describedby': 'extra' } });

      expect(wrapper.find('input').attributes('aria-describedby')).toStrictEqual('name-helper extra');
    });

    it('forwards listeners to the input', async() => {
      const onBlur = jest.fn();

      wrapper = mountInput({}, { attrs: { onBlur } });
      await wrapper.find('input').trigger('blur');

      expect(onBlur).toHaveBeenCalledWith(expect.any(FocusEvent));
    });

    it.each(['text', 'email', 'number', 'password', 'search', 'tel', 'url'])('renders type %s', (type) => {
      wrapper = mountInput({ type });

      expect(wrapper.find('input').attributes('type')).toStrictEqual(type);
    });

    it('marks the input invalid while it has an error', () => {
      wrapper = mountInput({ validationMessage: 'Required' });

      expect(wrapper.find('input').attributes('aria-invalid')).toStrictEqual('true');
    });

    it('marks the input required', () => {
      wrapper = mountInput({ label: 'Name', required: true });

      expect(wrapper.find('input').attributes('required')).toStrictEqual('');
    });
  });

  describe('clearable', () => {
    it('shows no clear button while empty', () => {
      wrapper = mountInput({ clearable: true, modelValue: '' });

      expect(wrapper.find('.rc-input-action').exists()).toBe(false);
    });

    it('clears the value', async() => {
      wrapper = mountInput({ clearable: true, modelValue: 'rancher' });

      await wrapper.find('.rc-input-action').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toStrictEqual([['']]);
      expect(wrapper.emitted('clear')).toStrictEqual([[]]);
    });

    it('names the clear button', () => {
      wrapper = mountInput({ clearable: true, modelValue: 'rancher' });

      expect(wrapper.find('.rc-input-action').attributes('aria-label')).toStrictEqual('%component.rcInput.clear%');
    });

    it('shows no clear button while disabled', () => {
      wrapper = mountInput({
        clearable: true, modelValue: 'rancher', disabled: true
      });

      expect(wrapper.find('.rc-input-action').exists()).toBe(false);
    });
  });

  describe('reset', () => {
    it('shows no Reset link without a reset value', () => {
      wrapper = mountInput({ label: 'Name', modelValue: 'rancher' });

      expect(wrapper.find('.rc-field-reset').exists()).toBe(false);
    });

    it('shows no Reset link while the value equals the reset value', () => {
      wrapper = mountInput({
        label: 'Name', modelValue: 'local', resetValue: 'local'
      });

      expect(wrapper.find('.rc-field-reset').exists()).toBe(false);
    });

    it('restores the reset value', async() => {
      wrapper = mountInput({
        label: 'Name', modelValue: 'rancher', resetValue: 'local'
      });

      await wrapper.find('.rc-field-reset').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toStrictEqual([['local']]);
      expect(wrapper.emitted('reset')).toStrictEqual([[]]);
    });
  });

  describe('view mode', () => {
    it('renders the value as text in place of the input', () => {
      wrapper = mountInput({ mode: 'view', modelValue: 'rancher' });

      expect(wrapper.find('input').exists()).toBe(false);
      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('rancher');
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty string', ''],
    ])('renders a dash for %s', (_, modelValue) => {
      wrapper = mountInput({ mode: 'view', modelValue });

      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('—');
    });

    it('renders zero rather than a dash', () => {
      wrapper = mountInput({ mode: 'view', modelValue: 0 });

      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('0');
    });

    it('masks a password', () => {
      wrapper = mountInput({
        mode: 'view', type: 'password', modelValue: 'secret'
      });

      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('••••••••');
    });

    it('passes the view state to the suffix slot', () => {
      wrapper = mountInput({ mode: 'view', modelValue: 'rancher' }, { slots: { suffix: '<template #suffix="{ isView }"><em>{{ isView }}</em></template>' } });

      expect(wrapper.find('em').text()).toStrictEqual('true');
    });

    it('does not render the prefix slot', () => {
      wrapper = mountInput({ mode: 'view' }, { slots: { prefix: '<em>prefix</em>' } });

      expect(wrapper.find('em').exists()).toBe(false);
    });
  });

  describe('inside an RcFieldGroup', () => {
    const mountInGroup = (groupProps: Record<string, unknown>, inputProps: Record<string, unknown> = {}) => mount(RcFieldGroup, {
      props: groupProps,
      slots: { default: () => h(RcInput, { modelValue: 'rancher', ...inputProps }) },
    });

    it('inherits view mode', () => {
      wrapper = mountInGroup({ mode: 'view' });

      expect(wrapper.find('.rc-input-view-value').text()).toStrictEqual('rancher');
    });

    it('inherits the disabled state', () => {
      wrapper = mountInGroup({ disabled: true });

      expect(wrapper.find('input').attributes('disabled')).toStrictEqual('');
    });

    it('lets the input override view mode', () => {
      wrapper = mountInGroup({ mode: 'view' }, { mode: 'edit' });

      expect(wrapper.find('input').exists()).toBe(true);
    });

    it('lets the input override the disabled state', () => {
      wrapper = mountInGroup({ disabled: true }, { disabled: false });

      expect(wrapper.find('input').attributes('disabled')).toBeUndefined();
    });
  });

  describe('exposed methods', () => {
    it.each(['focus', 'blur', 'select'] as const)('calls %s on the input', (method) => {
      wrapper = mountInput();
      const spy = jest.spyOn(wrapper.find('input').element, method);

      (wrapper.vm as unknown as Record<string, () => void>)[method]();

      expect(spy).toHaveBeenCalledWith();
    });
  });
});
