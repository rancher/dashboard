import { h } from 'vue';
import { mount } from '@vue/test-utils';
import RcField from './RcField.vue';
import RcFieldGroup from './RcFieldGroup.vue';
import type { RcFieldSlotProps } from './types';

const CONTROL = '<input :id="props.id" :aria-describedby="props.describedby" :data-invalid="props.invalid" :data-required="props.required" :data-disabled="props.disabled" :data-view="props.isView">';

const mountField = (props: Record<string, unknown> = {}) => mount(RcField, {
  props,
  slots: { default: `<template #default="props">${ CONTROL }</template>` },
});

describe('component: RcField', () => {
  describe('header', () => {
    it('renders no header without a label', () => {
      const wrapper = mountField();

      expect(wrapper.find('.rc-field-header').exists()).toBe(false);
    });

    it('associates the label with the control', () => {
      const wrapper = mountField({ label: 'Name', id: 'name' });
      const label = wrapper.find('label');

      expect(label.text()).toStrictEqual('Name');
      expect(label.attributes('for')).toStrictEqual('name');
      expect(wrapper.find('input').attributes('id')).toStrictEqual('name');
    });

    it('generates a control id when none is given', () => {
      const wrapper = mountField({ label: 'Name' });
      const id = wrapper.find('input').attributes('id');

      expect(id).toMatch(/^rc-field-/);
      expect(wrapper.find('label').attributes('for')).toStrictEqual(id);
    });

    it('marks a required field', () => {
      const wrapper = mountField({ label: 'Name', required: true });

      expect(wrapper.find('.rc-field-required').text()).toStrictEqual('*');
      expect(wrapper.find('input').attributes('data-required')).toStrictEqual('true');
    });

    it('renders the tooltip when given one', () => {
      const wrapper = mountField({ label: 'Name', tooltip: 'More about names' });

      expect(wrapper.find('.rc-field-tooltip').exists()).toBe(true);
    });

    it('emits reset from the Reset link', async() => {
      const wrapper = mountField({ label: 'Name', resettable: true });

      await wrapper.find('.rc-field-reset').trigger('click');

      expect(wrapper.emitted('reset')).toStrictEqual([[]]);
    });

    it('renders the Reset link without a label', () => {
      const wrapper = mountField({ resettable: true });

      expect(wrapper.find('.rc-field-reset').exists()).toBe(true);
      expect(wrapper.find('.rc-field-label').exists()).toBe(false);
    });

    it('hides the Reset link when disabled', () => {
      const wrapper = mountField({
        label: 'Name', resettable: true, disabled: true
      });

      expect(wrapper.find('.rc-field-reset').exists()).toBe(false);
    });
  });

  describe('footer', () => {
    it('marks the footer empty without a message or helper text', () => {
      const wrapper = mountField();

      expect(wrapper.find('.rc-field-footer').classes()).toContain('rc-field-footer-empty');
    });

    it('describes the control by its validation message then its helper text', () => {
      const wrapper = mountField({
        id: 'name', validationMessage: 'Required', helperText: 'Lowercase only'
      });

      expect(wrapper.find('input').attributes('aria-describedby')).toStrictEqual('name-validation name-helper');
      expect(wrapper.find('#name-validation .rc-field-validation-message').text()).toStrictEqual('Required');
      expect(wrapper.find('#name-helper').text()).toStrictEqual('Lowercase only');
    });

    it('leaves the live region empty without a message', () => {
      const wrapper = mountField({ helperText: 'Lowercase only' });
      const live = wrapper.find('.rc-field-live');

      expect(live.attributes('aria-live')).toStrictEqual('polite');
      expect(live.text()).toStrictEqual('');
    });

    it('announces the validation message with its status without duplicating it', async() => {
      const wrapper = mountField();

      await wrapper.setProps({ validationMessage: 'Name is required' });

      expect(wrapper.find('.rc-field-live').text()).toStrictEqual('%component.rcField.status.error% Name is required');
      expect(wrapper.text()).toStrictEqual('%component.rcField.status.error% Name is required');
    });

    it.each([
      ['error', 'true'],
      ['warning', 'false'],
      ['success', 'false'],
      ['info', 'false'],
    ])('marks the control invalid only for an error, given %s', (validationStatus, invalid) => {
      const wrapper = mountField({ validationMessage: 'Message', validationStatus });

      expect(wrapper.find('.rc-field-validation').classes()).toContain(`rc-field-validation-${ validationStatus }`);
      expect(wrapper.find('input').attributes('data-invalid')).toStrictEqual(invalid);
    });
  });

  it.each(['small', 'medium', 'large'])('applies the %s size class', (size) => {
    const wrapper = mountField({ size });

    expect(wrapper.classes()).toContain(`rc-field-${ size }`);
  });

  describe('view mode', () => {
    const viewProps = {
      id:                'name',
      mode:              'view',
      label:             'Name',
      required:          true,
      tooltip:           'More about names',
      resettable:        true,
      validationMessage: 'Required',
      helperText:        'Lowercase only',
    };

    it('passes the view state to the control', () => {
      const wrapper = mountField(viewProps);

      expect(wrapper.classes()).toContain('rc-field-view');
      expect(wrapper.find('input').attributes('data-view')).toStrictEqual('true');
    });

    it('renders the label as text rather than a label element', () => {
      const wrapper = mountField(viewProps);

      expect(wrapper.find('label').exists()).toBe(false);
      expect(wrapper.find('.rc-field-label').text()).toStrictEqual('Name');
    });

    it.each([
      ['required marker', '.rc-field-required'],
      ['tooltip', '.rc-field-tooltip'],
      ['Reset link', '.rc-field-reset'],
      ['validation message', '.rc-field-validation'],
    ])('hides the %s', (_, selector) => {
      const wrapper = mountField(viewProps);

      expect(wrapper.find(selector).exists()).toBe(false);
    });

    it('keeps the helper text', () => {
      const wrapper = mountField(viewProps);

      expect(wrapper.find('.rc-field-helper').text()).toStrictEqual('Lowercase only');
      expect(wrapper.find('input').attributes('aria-describedby')).toStrictEqual('name-helper');
    });
  });

  describe('inside an RcFieldGroup', () => {
    const fieldIn = (fieldProps: Record<string, unknown>) => h(RcField, fieldProps, {
      default: (props: RcFieldSlotProps) => h('input', {
        'data-disabled': `${ props.disabled }`,
        'data-view':     `${ props.isView }`,
      }),
    });

    const mountInGroup = (groupProps: Record<string, unknown>, fieldProps: Record<string, unknown> = {}) => mount(RcFieldGroup, {
      props: groupProps,
      slots: { default: () => fieldIn(fieldProps) },
    });

    it('inherits the group\'s state', () => {
      const wrapper = mountInGroup({ mode: 'view', disabled: true });
      const input = wrapper.find('input');

      expect(input.attributes('data-view')).toStrictEqual('true');
      expect(input.attributes('data-disabled')).toStrictEqual('true');
    });

    it('lets its own props override the group', () => {
      const wrapper = mountInGroup({ mode: 'view', disabled: true }, { mode: 'edit', disabled: false });
      const input = wrapper.find('input');

      expect(input.attributes('data-view')).toStrictEqual('false');
      expect(input.attributes('data-disabled')).toStrictEqual('false');
    });
  });
});
