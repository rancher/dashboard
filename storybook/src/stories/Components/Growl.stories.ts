import type { Meta, StoryObj } from '@storybook/vue3';
import GrowlManager from '@shell/components/GrowlManager.vue';

const meta: Meta<typeof GrowlManager> = { component: GrowlManager };

export default meta;
type Story = StoryObj<typeof GrowlManager>;

export const Default: Story = {
  render: (args: any) => ({
    components: { GrowlManager },
    setup() {
      return { args };
    },
    template: '<GrowlManager />',
  }),
};
