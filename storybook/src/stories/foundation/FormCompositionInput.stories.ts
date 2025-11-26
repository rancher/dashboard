import type { Meta, StoryObj } from '@storybook/vue3';
import LabeledInput from '@/shell/rc/Form/LabeledInput/LabeledInput.vue';
import { useForm } from 'vee-validate';
import formRulesGenerator from '@shell/utils/validators/formRules/index';

const meta: Meta<typeof LabeledInput> = { component: LabeledInput };

export default meta;
type Story = StoryObj<typeof LabeledInput>;

const displayValidation = () => `
<br />
<br />
<details>
<summary>Meta</summary>
<pre>Meta: {{ meta }}</pre>
<pre>Values: {{ values }}</pre>
<pre>Errors: {{ errVal }}</pre>
</details>
`;
let t; // This seems to be a Storybook bug not allowing hooks

export const Default: Story = {
  render: (args: any) => ({
    components: { LabeledInput },
    setup() {
      const validators = (key: string) => formRulesGenerator(t, { key });
      const {
        errors: errVal, values, meta, defineField
      } = useForm({
        validationSchema: { name: (val: string) => validators('name').required(val) ?? true },
        // validationSchema: { name: (val: string) => validators('name').minLength(3)(val) ?? true },
        initialValues:    { name: '' },
      });
      const [name, nameAttrs] = defineField('name');

      return {
        name,
        nameAttrs,
        values,
        errVal,
        meta,
        args
      };
    },
    created() {
      t = this.$store.getters['i18n/t']; // This seems to be a Storybook bug not allowing hooks
    },
    template: `
      <LabeledInput
        v-model:value="name"  
        v-bind="{
          ...args,
          ...nameAttrs
        }"
        :subLabel="errVal.name"
        :status="errVal.name ? 'error' : meta.touched ? 'success' : undefined"
        :tooltipKey="errVal.name ? errVal.name : meta.touched ? 'Input correct' : undefined"
      />
      ${ displayValidation() }
    `,
  }),
  args: {
    label: 'Name',
    type:  'text',
  },
};
