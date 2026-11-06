import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { RcInputUnit } from '@components/RcInput';

const column = 'display: flex; flex-direction: column; gap: 24px; max-width: 400px;';

const meta: Meta<typeof RcInputUnit> = {
  component: RcInputUnit,
  argTypes:  {
    modelValue: { control: { type: 'text' }, description: 'The quantity, bound with `v-model`. Use `v-model.number` with `type="number"` for a number.' },
    unit:       { control: { type: 'text' }, description: 'The unit of measurement. Long units are truncated, at 100, 120 and 140px by size.' },
    size:       { options: ['small', 'medium', 'large'], control: { type: 'select' } },
    mode:       {
      options:     ['edit', 'view'],
      control:     { type: 'select' },
      description: 'In view mode the unit follows the value inline. Unset, the mode comes from the nearest RcFieldGroup.',
    },
    disabled:          { control: { type: 'boolean' } },
    type:              { options: ['text', 'number'], control: { type: 'select' } },
    label:             { control: { type: 'text' } },
    helperText:        { control: { type: 'text' } },
    validationMessage: { control: { type: 'text' } },
  },
};

export default meta;
type Story = StoryObj<typeof RcInputUnit>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcInputUnit },
    setup() {
      return { args };
    },
    template: `<div style="${ column }"><RcInputUnit v-bind="args" @update:model-value="args.modelValue = $event" /></div>`,
  }),
  args: {
    modelValue: '512',
    unit:       'MiB',
    label:      'Memory reservation',
    helperText: 'The memory the scheduler sets aside for each container.',
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { RcInputUnit },
    setup() {
      return { sizes: ['small', 'medium', 'large'], value: ref('512') };
    },
    template: `
      <div style="${ column }">
        <RcInputUnit v-for="size in sizes" :key="size" v-model="value" :size="size" :label="size" unit="Unit of measurement" />
      </div>`,
  }),
};

export const NumericValue: Story = {
  render: () => ({
    components: { RcInputUnit },
    setup() {
      return { cpu: ref(500) };
    },
    template: `
      <div style="${ column }">
        <RcInputUnit v-model.number="cpu" type="number" label="CPU reservation" unit="mCPUs" />
        <code>{{ typeof cpu }}: {{ cpu }}</code>
      </div>`,
  }),
};

export const ViewMode: Story = {
  render: () => ({
    components: { RcInputUnit },
    setup() {
      return { memory: ref('512'), cpu: ref('500') };
    },
    template: `
      <div style="${ column }">
        <RcInputUnit v-model="memory" mode="view" label="Memory reservation" unit="MiB" />
        <RcInputUnit v-model="cpu" mode="view" label="CPU reservation" unit="mCPUs" />
      </div>`,
  }),
};
