import type { Meta, StoryObj } from '@storybook/vue3';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { useForm, useFieldArray } from 'vee-validate';

const meta: Meta<typeof ArrayList> = { component: ArrayList };

export default meta;
type Story = StoryObj<typeof ArrayList>;

const displayValidation = () => `
<br />
<br />
<pre><code>
Values: {{ values }}
Errors: {{ errVal }}
Meta: {{ meta }}
</code></pre>
`;

const Template: Story = {
  render: (args: any) => ({
    components: { ArrayList },
    setup() {
      const { errors: errVal, values, meta } = useForm({
        validationSchema: { name: (val: string) => val !== '' ? true : 'Field is required' },
        initialValues:    { myList: [{ name: '' }] },
      });
      const { remove, push, fields } = useFieldArray('myList');

      return {
        remove,
        push,
        fields,
        values,
        errVal,
        meta,
        args
      };
    },
    template: `
    <ArrayList
      v-model:value="fields"
      v-bind="args"
    >
    
    </ArrayList>
    ${ displayValidation() }
    `,
  }),
};

export const Default: Story = {
  ...Template,
  args: {},
};
