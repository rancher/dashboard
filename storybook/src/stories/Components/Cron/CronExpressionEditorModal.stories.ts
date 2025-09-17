import type { Meta, StoryObj } from '@storybook/vue3';
import { ref, watch, onMounted } from 'vue';
import CronExpressionEditorModal from '@shell/components/Cron/CronExpressionEditorModal.vue';
import { LabeledInput } from '@components/Form/LabeledInput';

const meta: Meta<typeof CronExpressionEditorModal> = { component: CronExpressionEditorModal };

export default meta;

type Story = StoryObj<typeof CronExpressionEditorModal>;

export const Default: Story = {
  render: (args: { show: boolean; cronExpression: string }) => ({
    components: { LabeledInput, CronExpressionEditorModal },
    setup() {
      const show = ref(args.show);
      const cron = ref(args.cronExpression || '* * * * *');
      const readableCron = ref('');

      watch(show, (val) => {
        args.show = val;
      });

      const openModal = () => {
        show.value = true;
      };

      onMounted(() => {
        if (!document.getElementById('modals')) {
          const div = document.createElement('div');

          div.id = 'modals';
          document.body.appendChild(div);
        }
      });

      return {
        show,
        cron,
        readableCron,
        openModal,
        args,
      };
    },
    template: `
      <div>
        <div class="col span-6" style="display: flex; col">
          <LabeledInput
            v-model:value="cron"
            label="Cron Expression"
            placeholder="* * * * *"
            :subLabel="readableCron"
          />
          <button class="btn role-primary ml-10" @click="openModal">Edit</button>
        </div>
        <CronExpressionEditorModal
          v-model:show="show"
          v-model:cronExpression="cron"
          v-model:readableCron="readableCron"
        />
      </div>
    `,
  }),
  args: {
    cronExpression: '* * * * *',
    show:           false,
  },
};
