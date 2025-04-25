import type { Meta, StoryObj } from '@storybook/vue3';
import { Form, Field } from 'vee-validate';
import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';

const meta: Meta = {};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args: any) => ({
    components: {
      Form, Field, LabeledInput
    },
    template: `
      <Form>
        <Field
          name="field"
          value=""
          :rules="(value) => value && value.trim() ? true : 'This is required'"
          v-slot="{ field, meta }"
        >
          <LabeledInput
            name="field"
            v-bind="field"
            placeholder="Keep it empty and blur this field"
            :subLabel="meta.errors.join(', ')"
            :status="!!meta.errors.length ? 'error' : meta.touched ? 'success' : undefined"
            :tooltipKey="!!meta.errors.length ? meta.errors.join(', ') : meta.touched ? 'Input correct' : undefined"
          />
          <br />
          <br />
          <pre>{{ meta }}</pre>
        </Field>
      </Form>
    `,
  }),
};
