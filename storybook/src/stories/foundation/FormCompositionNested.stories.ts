import LabeledInput from '@/shell/rc/Form/LabeledInput/LabeledInput.vue';
import type { Meta, StoryObj } from '@storybook/vue3';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { useForm, useFieldArray } from 'vee-validate';
import formRulesGenerator from '@shell/utils/validators/formRules/index';
import { toTypedSchema } from '@vee-validate/zod';
import * as zod from 'zod';

const meta: Meta = {};

export default meta;
type Story = StoryObj;

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
    components: {
      Tab, Tabbed, LabeledInput
    },
    setup() {
      const validators = (key: string) => formRulesGenerator((key: string) => key, { key });
      const { errors: errVal, values, meta } = useForm({
        // https://zod.dev/?id=custom-schemas
        validationSchema: toTypedSchema(
          zod.object({
            containers: zod.object({
              name:  zod.custom((val) => !validators('').required(val), validators('Container name').required(undefined)),
              image: zod.custom((val) => !validators('').required(val), validators('Container image').required(undefined)),
            }).array(),
          })
        ),
        initialValues: { containers: [{ name: '1', image: '' }, { name: '2', image: '' }] }
      });

      const {
        remove: removeContainer,
        push: addContainer,
        fields: containers
      } = useFieldArray('containers');

      return {
        removeContainer,
        addContainer,
        containers,
        values,
        errVal,
        meta,
        args
      };
    },
    methods: {
      getErrors: <T extends object>(errVal: T, prefix: string, i: number, suffix?: string) => Object
        .keys(errVal)
        .filter((key) => key.includes(`${ prefix }[${ i }]${ suffix ? `.${ suffix }` : '' }`))
        .map((key: string) => errVal[key as keyof T])

    },
    template: `
    <Tabbed v-bind="args">
      <Tab
        v-for="(container, i) in containers"
        :key="container.key"
        :name="'Container ' + (i + 1)"
        :displayAlertIcon="!!getErrors(errVal, 'containers', i).length"
      >
        <Tabbed :useHash=${ args.useHash } :sideTabs=${ true }>
          <Tab
            name="name"
            label="Name settings"
            :displayAlertIcon="!!getErrors(errVal, 'containers', i, 'name').length"
          >
            <LabeledInput
              v-model:value="container.value.name"
              label="Container name"
              type="text"
              :subLabel="getErrors(errVal, 'containers', i, 'name').join(', ')"
              :status="getErrors(errVal, 'containers', i, 'name').length ? 'error' : meta.touched ? 'success' : undefined"
            />
          </Tab>
          <Tab
            name="image"
            label="Image settings"
            :displayAlertIcon="!!getErrors(errVal, 'containers', i, 'image').length"
          >
            <LabeledInput
              v-model:value="container.value.image"
              label="Container image"
              type="text"
              :subLabel="getErrors(errVal, 'containers', i, 'image').join(', ')"
              :status="getErrors(errVal, 'containers', i, 'image').length ? 'error' : meta.touched ? 'success' : undefined"
            />
          </Tab>
        </Tabbed>

        <br />
        <button @click="removeContainer(i)">Remove</button>
      </Tab>

      <template #tab-row-extras>
        <li class="tablist-controls">
          <button @click="addContainer({ name: '', image: '' })">Add container</button>
        </li>
      </template>
    </Tabbed>
    ${ displayValidation() }
    `,
  })
};

export const Default: Story = {
  ...Template,
  args: { useHash: false },
};
