import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import CronExpressionEditor from '@shell/components/Cron/CronExpressionEditor.vue';

const meta: Meta<typeof CronExpressionEditor> = {
  component: CronExpressionEditor,
  argTypes:  { cronExpression: { control: 'text', description: 'Initial cron expression' } },
};

export default meta;

type Story = StoryObj<typeof CronExpressionEditor>;

export const Default: Story = {
  render: (args: { cronExpression: any; }) => ({
    components: { CronExpressionEditor },
    setup() {
      const cron = ref(args.cronExpression || '* * * * *');
      const readable = ref('');
      const valid = ref(true);

      return {
        args, cron, readable, valid
      };
    },
    template: `
      <div>
        <CronExpressionEditor
          :cronExpression="cron"
          @update:cronExpression="cron = $event"
          @update:readableCron="readable = $event"
          @update:isValid="valid = $event"
        />
        <div style="margin-top: 12px;" class="body-text">
          <strong>Cron Expression:</strong> {{ cron }} <br/>
          <strong>Readable Cron:</strong> {{ readable }} <br/>
          <strong>Valid:</strong> {{ valid }}
        </div>
      </div>
    `,
  }),
  args: { cronExpression: '* * * * *' },
};
