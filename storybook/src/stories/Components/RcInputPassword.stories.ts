import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { RcInputPassword } from '@components/RcInput';

const column = 'display: flex; flex-direction: column; gap: 24px; max-width: 400px;';

const meta: Meta<typeof RcInputPassword> = {
  component: RcInputPassword,
  argTypes:  {
    modelValue: { control: { type: 'text' }, description: 'The secret, bound with `v-model`.' },
    revealed:   {
      control:     { type: 'boolean' },
      description: 'Whether the value is shown. Bind with `v-model:revealed` to control or observe the toggle.',
    },
    size: {
      options: ['small', 'medium', 'large'],
      control: { type: 'select' },
    },
    mode: {
      options:     ['edit', 'view'],
      control:     { type: 'select' },
      description: 'In view mode the value stays masked until revealed. Unset, the mode comes from the nearest RcFieldGroup.',
    },
    disabled:          { control: { type: 'boolean' } },
    label:             { control: { type: 'text' } },
    helperText:        { control: { type: 'text' } },
    validationMessage: { control: { type: 'text' } },
    required:          { control: { type: 'boolean' } },
  },
};

export default meta;
type Story = StoryObj<typeof RcInputPassword>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcInputPassword },
    setup() {
      return { args };
    },
    template: `
      <div style="${ column }">
        <RcInputPassword
          v-bind="args"
          autocomplete="new-password"
          @update:model-value="args.modelValue = $event"
          @update:revealed="args.revealed = $event"
        />
      </div>`,
  }),
  args: {
    modelValue: 'hunter2',
    label:      'Access token',
    helperText: 'Stored as a Kubernetes secret.',
    required:   true,
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { RcInputPassword },
    setup() {
      return { sizes: ['small', 'medium', 'large'], secret: ref('hunter2') };
    },
    template: `
      <div style="${ column }">
        <RcInputPassword v-for="size in sizes" :key="size" v-model="secret" :size="size" :label="size" />
      </div>`,
  }),
};

export const ControlledReveal: Story = {
  render: () => ({
    components: { RcInputPassword },
    setup() {
      return {
        revealed: ref(false), accessKey: ref('AKIAIOSFODNN7EXAMPLE'), secretKey: ref('wJalrXUtnFEMI/K7MDENG')
      };
    },
    template: `
      <div style="${ column }">
        <label style="display: flex; gap: 8px; align-items: center;">
          <input v-model="revealed" type="checkbox"> Show all secrets
        </label>
        <RcInputPassword v-model="accessKey" v-model:revealed="revealed" label="Access key" />
        <RcInputPassword v-model="secretKey" v-model:revealed="revealed" label="Secret key" />
      </div>`,
  }),
};

export const ViewMode: Story = {
  render: () => ({
    components: { RcInputPassword },
    setup() {
      return { secret: ref('hunter2'), empty: ref('') };
    },
    template: `
      <div style="${ column }">
        <RcInputPassword v-model="secret" mode="view" label="Masked until revealed" />
        <RcInputPassword v-model="empty" mode="view" label="Empty, so no toggle" />
      </div>`,
  }),
};
