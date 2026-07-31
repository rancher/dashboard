import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { LabeledInput } from '@components/Form/LabeledInput';

const meta: Meta<typeof LabeledInput> = {
  component: LabeledInput,
  argTypes:  {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'url', 'tel', 'cron', 'integer'],
    },
    mode: {
      control: 'select',
      options: ['edit', 'view'],
    },
    label:            { control: 'text' },
    placeholder:      { control: 'text' },
    showClearButton:  { control: 'boolean' },
    clearButtonLabel: { control: 'text' },
    required:         { control: 'boolean' },
    disabled:         { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof LabeledInput>;

export const Default: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    label:       'Name',
    placeholder: 'Enter your name',
    type:        'text',
  },
};

export const SearchWithClearButton: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('kubernetes pods');

      return { args, value };
    },
    template: `
      <div>
        <LabeledInput v-bind="args" v-model:value="value" />
        <p style="margin-top: 10px; color: var(--input-text);">
          Current value: "{{ value }}"
        </p>
      </div>
    `,
  }),
  args: {
    type:        'search',
    placeholder: 'Search resources...',
    label:       'Search',
  },
};

export const SearchEmptyState: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('');

      return { args, value };
    },
    template: `
      <div>
        <LabeledInput v-bind="args" v-model:value="value" />
        <p style="margin-top: 10px; color: var(--muted);">
          Type something to see the clear button appear
        </p>
      </div>
    `,
  }),
  args: {
    type:        'search',
    placeholder: 'Search...',
    label:       'Search',
  },
};

export const TextWithClearButton: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('Custom text with clear button');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    type:             'text',
    label:            'Custom Input',
    placeholder:      'Enter text',
    showClearButton:  true,
  },
};

export const SearchWithCustomClearLabel: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('nginx');

      return { args, value };
    },
    template: `
      <div>
        <LabeledInput v-bind="args" v-model:value="value" />
        <p style="margin-top: 10px; color: var(--muted);">
          The clear button is announced as "Clear Filter for table results"
          instead of the generic "Clear"
        </p>
      </div>
    `,
  }),
  args: {
    type:             'search',
    label:            'Filter',
    placeholder:      'Filter...',
    clearButtonLabel: 'Clear Filter for table results',
  },
};

export const SearchCompact: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('search query');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    type:        'search',
    placeholder: 'Search...',
    mode:        'edit',
  },
};

export const SearchDisabled: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('disabled search');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    type:        'search',
    label:       'Disabled Search',
    placeholder: 'Search...',
    mode:        'view',
  },
};

export const Required: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    label:       'Required Field',
    placeholder: 'This field is required',
    type:        'text',
    required:    true,
  },
};

export const WithTooltip: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    label:       'Username',
    placeholder: 'Enter username',
    type:        'text',
    tooltip:     'Your username must be unique across the system',
  },
};

export const Integer: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('42');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    label:       'Port Number',
    placeholder: 'Enter port',
    type:        'integer',
  },
};

export const Cron: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const value = ref('0 * * * *');

      return { args, value };
    },
    template: '<LabeledInput v-bind="args" v-model:value="value" />',
  }),
  args: {
    label:       'Schedule',
    placeholder: 'Enter cron expression',
    type:        'cron',
  },
};
