import type { Meta, StoryObj } from '@storybook/vue3';
import { RcIconTooltip } from '@components/RcIconTooltip';
import { RcIconTypeToClass } from '@components/RcIcon/types';

const meta: Meta<typeof RcIconTooltip> = {
  component: RcIconTooltip,
  argTypes:  {
    content: {
      control:     { type: 'text' },
      description: 'The tooltip text. Accepts a floating-vue options object instead when the tooltip needs options such as `popperClass`. No tooltip is shown when this is empty, but the icon still renders.'
    },
    label: {
      control:     { type: 'text' },
      description: 'The accessible name for the control. Defaults to `More Info`, since naming it after the message would have the message announced twice: once as the name and once as the description.'
    },
    iconType: {
      options:     Object.keys(RcIconTypeToClass),
      control:     { type: 'select' },
      description: 'Determines which icon will be shown.'
    },
  }
};

export default meta;
type Story = StoryObj<typeof RcIconTooltip>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcIconTooltip },
    setup() {
      return { args };
    },
    template: '<RcIconTooltip v-bind="args" />',
  }),
  args: { content: 'More context or explanation about an element.' },
};

export const InALabel: Story = {
  render: (args: any) => ({
    components: { RcIconTooltip },
    setup() {
      return { args };
    },
    template: `<label style="display: inline-flex; align-items: center; gap: 4px;">
      Pull Secrets
      <RcIconTooltip v-bind="args" />
    </label>`,
  }),
  args: { content: 'Secrets used to pull images from a private registry.' },
};

export const Warning: Story = {
  render: (args: any) => ({
    components: { RcIconTooltip },
    setup() {
      return { args };
    },
    template: '<RcIconTooltip v-bind="args" />',
  }),
  args: {
    content:  'This value must be a number.',
    label:    'Warning',
    iconType: 'warning'
  },
};
