import type { Meta, StoryObj } from '@storybook/vue3';
import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';

const meta: Meta<typeof LabeledInput> = { component: LabeledInput };

export default meta;
type Story = StoryObj<typeof LabeledInput>;

export const Default: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      return { args };
    },
    template: '<LabeledInput v-bind="args" />',
  }),
  args: {
    label: 'Name',
    type:  'text',
    value: 'Simon',
  },
};

export const Info: Story = {
  ...Default,
  args: {
    label:      'Name',
    type:       'text',
    value:      'Simon',
    status:     'info',
    tooltipKey: 'Info message'
  },
};

export const Success: Story = {
  ...Default,
  args: {
    label:      'Name',
    type:       'text',
    value:      'Simon',
    status:     'success',
    tooltipKey: 'Success message'
  },
};

export const Warning: Story = {
  ...Default,
  args: {
    label:      'Name',
    type:       'text',
    value:      'Simon',
    status:     'warning',
    tooltipKey: 'Warning message'
  },
};

export const Error: Story = {
  ...Default,
  args: {
    label:      'Name',
    type:       'text',
    value:      'Simon',
    status:     'error',
    tooltipKey: 'Error message'
  },
};

export const SubLabel: Story = {
  ...Default,
  args: {
    label:    'Name',
    subLabel: 'Additional information',
    type:     'text',
    value:    'Simon',
  },
};

export const CronType: Story = {
  ...Default,
  args: {
    label: 'Period',
    type:  'cron',
    value: '0 * * * *',
  },
};

export const CronTypeDaily: Story = {
  ...Default,
  args: {
    label: 'Period',
    type:  'cron',
    value: '@daily',
  },
};

export const CronTypeError: Story = {
  ...Default,
  args: {
    label: 'Period',
    type:  'cron',
    value: 'not a cron expression',
  },
};

export const MultilineType: Story = {
  ...Default,
  args: {
    label: 'Period',
    type:  'multiline',
    value: `this
is
a
multiline
text`,
  },
};
