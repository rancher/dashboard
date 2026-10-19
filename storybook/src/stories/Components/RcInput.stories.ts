import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { RcInput, RcInputPassword, RcInputSearch, RcInputUnit } from '@components/RcInput';
import { RcIcon } from '@components/RcIcon';

const SIZES = ['small', 'medium', 'large'];

const column = 'display: flex; flex-direction: column; gap: 24px; max-width: 400px;';
const grid = 'display: grid; grid-template-columns: repeat(3, 280px); gap: 24px 32px; align-items: start;';
const heading = 'margin: 0; font-size: 12px; font-weight: 600; color: var(--input-label); text-transform: capitalize;';

const meta: Meta<typeof RcInput> = {
  component: RcInput,
  argTypes:  {
    modelValue: {
      control:     { type: 'text' },
      description: 'The value, bound with `v-model`. The `.number` and `.trim` modifiers are supported.',
    },
    size: {
      options:     SIZES,
      control:     { type: 'select' },
      description: 'Matches the density of the form. The label, helper text and validation message scale with the field.',
    },
    mode: {
      options:     ['edit', 'view'],
      control:     { type: 'select' },
      description: '`view` renders the value only, without the field chrome. Unset, the input takes the mode of the nearest RcFieldGroup, or `edit` outside one.',
    },
    disabled: {
      control:     { type: 'boolean' },
      description: 'Unset, the input takes the disabled state of the nearest RcFieldGroup.',
    },
    type: {
      options:     ['text', 'email', 'number', 'password', 'search', 'tel', 'url'],
      control:     { type: 'select' },
      description: 'The native input type. Prefer RcInputPassword and RcInputSearch over `password` and `search`.',
    },
    label: {
      control:     { type: 'text' },
      description: 'The visible label. Without one, give the input an `aria-label`.',
    },
    placeholder: { control: { type: 'text' }, description: 'A hint shown while the input is empty.' },
    helperText:  { control: { type: 'text' }, description: 'Guidance shown under the input, in every mode.' },
    tooltip:     { control: { type: 'text' }, description: 'Content for the info icon beside the label.' },
    required:    { control: { type: 'boolean' }, description: 'Marks the label and sets `required` on the input.' },
    clearable:   { control: { type: 'boolean' }, description: 'Shows a button that empties the input while it holds a value.' },
    resetValue:  { control: { type: 'text' }, description: 'Shows a Reset link that restores this value while the value differs from it.' },

    validationMessage: { control: { type: 'text' }, description: 'A message under the input. Hidden in view mode.' },
    validationStatus:  {
      options:     ['error', 'warning', 'success', 'info'],
      control:     { type: 'select' },
      description: 'Only `error` marks the input `aria-invalid`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcInput>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcInput },
    setup() {
      return { args };
    },
    template: `<div style="${ column }"><RcInput v-bind="args" @update:model-value="args.modelValue = $event" /></div>`,
  }),
  args: {
    modelValue: 'my-cluster',
    label:      'Cluster name',
    helperText: 'Lowercase letters, numbers and hyphens.',
    tooltip:    'The name appears in the cluster\'s URL.',
    required:   true,
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { RcInput },
    setup() {
      return { sizes: SIZES, value: ref('Regular value') };
    },
    template: `
      <div style="${ column }">
        <RcInput
          v-for="size in sizes"
          :key="size"
          v-model="value"
          :size="size"
          :label="size"
          tooltip="The header scales with the field."
          helper-text="The helper text scales with the field."
          :reset-value="'Default value'"
          required
        />
      </div>`,
  }),
};

export const AllStates: Story = {
  render: () => ({
    components: {
      RcInput, RcInputPassword, RcInputSearch, RcInputUnit
    },
    setup() {
      return {
        states: [
          { title: 'edit', props: {} },
          { title: 'disabled', props: { disabled: true } },
          { title: 'view', props: { mode: 'view' } },
        ],
        empty:    ref(''),
        regular:  ref('Regular value'),
        erasable: ref('Erasable value'),
        unit:     ref('512'),
        secret:   ref('hunter2'),
        search:   ref('Search for value'),
      };
    },
    template: `
      <div style="${ grid }">
        <h3 v-for="state in states" :key="state.title" style="${ heading }">{{ state.title }}</h3>
        <template v-for="state in states" :key="state.title + '-empty'">
          <RcInput v-model="empty" v-bind="state.props" label="Empty" />
        </template>
        <template v-for="state in states" :key="state.title + '-hint'">
          <RcInput v-model="empty" v-bind="state.props" label="Empty with hint" placeholder="Input hint" />
        </template>
        <template v-for="state in states" :key="state.title + '-regular'">
          <RcInput v-model="regular" v-bind="state.props" label="Regular value" />
        </template>
        <template v-for="state in states" :key="state.title + '-unit'">
          <RcInputUnit v-model="unit" v-bind="state.props" label="Unit of measurement" unit="MiB" />
        </template>
        <template v-for="state in states" :key="state.title + '-erasable'">
          <RcInput v-model="erasable" v-bind="state.props" label="Erasable value" clearable />
        </template>
        <template v-for="state in states" :key="state.title + '-password'">
          <RcInputPassword v-model="secret" v-bind="state.props" label="Password" />
        </template>
        <template v-for="state in states" :key="state.title + '-search'">
          <RcInputSearch v-if="state.title !== 'view'" v-model="search" :disabled="state.props.disabled" label="Search" />
          <span v-else style="${ heading } text-transform: none; font-weight: 400;">Search has no view mode.</span>
        </template>
      </div>`,
  }),
};

export const Focused: Story = {
  render: () => ({
    components: { RcInput },
    setup() {
      return { value: ref('Regular value') };
    },
    template: `<div style="${ column }"><RcInput v-model="value" label="Focused" validation-message="Focus stays blue, even on error." /></div>`,
  }),
  parameters: { pseudo: { focus: ['.rc-input-control'] } },
};

export const Validation: Story = {
  render: () => ({
    components: { RcInput },
    setup() {
      return {
        messages: {
          error:   'An error message',
          warning: 'A warning message',
          success: 'A success message',
          info:    'An info message',
        },
        value: ref('Regular value'),
      };
    },
    template: `
      <div style="${ column }">
        <RcInput
          v-for="(message, status) in messages"
          :key="status"
          v-model="value"
          :label="status"
          :validation-status="status"
          :validation-message="message"
          helper-text="The helper text sits under the message."
        />
      </div>`,
  }),
};

export const ClearAndReset: Story = {
  render: () => ({
    components: { RcInput },
    setup() {
      return { name: ref('my-cluster'), replicas: ref('5') };
    },
    template: `
      <div style="${ column }">
        <RcInput v-model="name" label="Clearable" clearable helper-text="Empty the input to hide the button." />
        <RcInput v-model="replicas" label="Resettable" reset-value="3" helper-text="Reset restores 3, and hides once the value is 3." />
      </div>`,
  }),
};

export const PrefixAndSuffix: Story = {
  render: () => ({
    components: { RcInput, RcIcon },
    setup() {
      return { host: ref('rancher.example.com'), isView: ref(false) };
    },
    template: `
      <div style="${ column }">
        <RcInput v-model="host" label="Host">
          <template #prefix>
            <RcIcon type="globe" size="medium" />
          </template>
          <template #suffix="{ isView }">
            <span style="color: var(--input-label);">{{ isView ? '(external)' : ':443' }}</span>
          </template>
        </RcInput>
        <RcInput v-model="host" label="Host, view mode" mode="view">
          <template #suffix="{ isView }">
            <span style="color: var(--input-label);">{{ isView ? '(external)' : ':443' }}</span>
          </template>
        </RcInput>
      </div>`,
  }),
};

export const WithoutVisibleLabel: Story = {
  render: () => ({
    components: { RcInput },
    setup() {
      return { value: ref('') };
    },
    template: `<div style="${ column }"><RcInput v-model="value" aria-label="Namespace" placeholder="Namespace" /></div>`,
  }),
};

export const LongValidationMessage: Story = {
  render: () => ({
    components: { RcInput },
    setup() {
      return { sizes: SIZES, value: ref('My Cluster') };
    },
    template: `
      <div style="${ column } resize: horizontal; overflow: auto; padding: 8px; border: 1px dashed var(--border);">
        <RcInput
          v-for="size in sizes"
          :key="size"
          v-model="value"
          :size="size"
          :label="size"
          validation-message="The name must be unique within its namespace and contain only lowercase letters, numbers and hyphens."
          helper-text="The helper text wraps as usual."
        />
      </div>`,
  }),
};
