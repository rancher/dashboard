import type { Meta, StoryObj } from '@storybook/vue3';
import { Form, Field } from 'vee-validate';
import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';

const meta: Meta = {};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    components: {
      Form, Field, LabeledInput
    },
    data:     () => ({ value: '' }),
    template: `
      <Form v-slot="{ errors, meta: formMeta }">
        <LabeledInput
          v-model:value="value"
          :veerules="(value) => value && value.trim() ? true : 'This is required'"
          placeholder="Keep it empty and blur this field"
        />
        <br />
        <br />
        <details>
          <summary>Meta</summary>
          <pre>Value: {{ value }}</pre>
          <pre>Meta: {{ formMeta }}</pre>
          <pre>Errors: {{ errors }}</pre>
        </details>
      </Form>
    `,
  }),
};
