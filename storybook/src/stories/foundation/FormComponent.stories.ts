import type { Meta, StoryObj } from '@storybook/vue3';
import ArrayList from '@shell/components/form/ArrayList.vue';
import { useForm } from 'vee-validate';

const meta: Meta<typeof ArrayList> = { component: ArrayList };

export default meta;
type Story = StoryObj<typeof ArrayList>;

const displayValidation = () => `
<br />
<br />
<h3>Metadata generated:</h3>
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
