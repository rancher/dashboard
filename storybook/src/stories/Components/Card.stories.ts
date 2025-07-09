import type { Meta, StoryObj } from '@storybook/vue3';
import Card from '@/pkg/rancher-components/src/components/Card/Card.vue';

const meta: Meta<typeof Card> = {
  component: Card,
  argTypes:  {
    title: { control: 'text' },
    body:  { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args: any) => ({
    components: { Card },
    setup() {
      return { args };
    },
    template: `
      <Card v-bind="args">
        <template v-if="args.title" v-slot:title>{{ args.title }}</template>
        <template v-if="args.body" v-slot:body>{{ args.body }}</template>
      </Card>
    `,
  })
};

export const WithContent: Story = {
  ...Default,
  args: {
    title: 'Card title',
    body:  'Some quick example text to build on the card title and make up the bulk of the card\'s content.',
  },
};
