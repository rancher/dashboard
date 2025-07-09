import type { Meta, StoryObj } from '@storybook/vue3';
import Banner from '@/pkg/rancher-components/src/components/Banner/Banner.vue';

const meta: Meta<typeof Banner> = {
  component: Banner,
  argTypes:  {
    label:    { control: 'text' },
    closable: { control: 'boolean' },
    color:    { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Banner },
    setup() {
      return { args };
    },
    template: '<Banner v-bind="args" />',
  }),
};

export const Closable: Story = {
  ...Default,
  args: {
    label:    'Please update system with new patch',
    closable: true,
  },
};

export const Stacked: Story = {
  ...Default,
  template: '<Banner v-bind="args" /><Banner v-bind="args" /><Banner v-bind="args" />',
  args:     {
    label:   'First message',
    stacked: true,
  },
};

export const Primary: Story = {
  ...Default,
  args: {
    label: 'Please update system with new patch',
    color: 'primary',
  },
};

export const Secondary: Story = {
  ...Default,
  args: {
    label: 'Please update system with new patch',
    color: 'secondary',
  },
};

export const Icon: Story = {
  ...Default,
  args: {
    label: 'Error in the Pod Security Access',
    icon:  'icon-pod_security',
  },
};

export const Success: Story = {
  ...Default,
  args: {
    label: 'Your account has been successfully migrated to the new user interface.',
    color: 'success',
  },
};

export const Info: Story = {
  ...Default,
  args: {
    label: 'The new Patch Finder 2.0 will be released soon.',
    color: 'info',
  },
};

export const Warning: Story = {
  ...Default,
  args: {
    label: 'Your browser is outdated. For a better experience consider upgrading it to the latest version available.',
    color: 'warning',
  },
};

export const Error: Story = {
  ...Default,
  args: {
    label: 'The connection has been lost. Check your connection and refresh this page.',
    color: 'error',
  },
};
