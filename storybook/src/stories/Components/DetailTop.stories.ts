import type { Meta, StoryObj } from '@storybook/vue3';
import DetailTop from '@shell/components/DetailTop';

const meta: Meta<typeof DetailTop> = { component: DetailTop };

export default meta;
type Story = StoryObj<typeof DetailTop>;

export const Default: Story = {
  render: (args: any) => ({
    components: { DetailTop },
    setup() {
      return { args };
    },
    template: '<DetailTop v-bind="args" />',
  }),
};

export const Basic: Story = {
  ...Default,
  args: {
    value: {
      namespaces: [{
        metadata: {
          name:           'default',
          detailLocation: 'location'
        },
      }],
      labels: {
        'kubernetes.io/metadata.name': 'anyValue',
        'label/with':                  'icon',
      }
    },
    icons: { 'label/with': 'icon-lock' }
  },
};

export const Tooltips: Story = {
  ...Default,
  args: {
    value: {
      namespaces: [{
        medatada: {
          name:           'default',
          detailLocation: 'location'
        },
      }],
      labels: {
        'kubernetes.io/metadata.name':        'anyValue',
        'pod-security.kubernetes.io/enforce': 'privileged',
        originalKey:                          'value displayed in tooltip only',
      }
    },
    icons:    { 'pod-security.kubernetes.io/enforce': 'icon-pod_security' },
    tooltips: {
      'pod-security.kubernetes.io/enforce': 'Enforce Privileged (latest)',
      originalKey:                          'Hover me',
    },
  },
};
