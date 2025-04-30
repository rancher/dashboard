import type { Meta, StoryObj } from '@storybook/vue3';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { useForm } from 'vee-validate';

const meta: Meta<typeof ArrayList> = { component: ArrayList };

export default meta;
type Story = StoryObj<typeof ArrayList>;

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

const Template: Story = {
  render: (args: any) => ({
    components: { ArrayList },
    setup() {
      const {
        errors: errVal, values, meta, defineField
      } = useForm({
        validationSchema: { list: (values: string[]) => ['openid', 'profile', 'email'].every((scope) => values.includes(scope)) ? true : 'It should include "openid profile email"' },
        initialValues:    { list: ['openid', 'profile'] },
      });
      const [list] = defineField('list');

      return {
        list,
        values,
        errVal,
        meta,
        args
      };
    },
    template: `
    <ArrayList
      v-model:value="list"
      v-bind="args"
    ></ArrayList>
    <br />
    <p v-if="errVal && errVal.list">{{errVal.list}}</p>
    ${ displayValidation() }
    `,
  }),
};

export const Default: Story = {
  ...Template,
  args: {},
};
