import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';
import type { Meta, StoryObj } from '@storybook/vue3';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { useForm, useFieldArray } from 'vee-validate';
import formRulesGenerator from '@shell/utils/validators/formRules/index';
import * as yup from 'yup';

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
let t;
const Template: Story = {
  render: (args: any) => ({
    components: {
      Tab, Tabbed, LabeledInput
    },
    setup() {
      let message: string;
      const validators = (key: string) => formRulesGenerator(t, { key });
      // https://github.com/jquense/yup?tab=readme-ov-file#schematestname-string-message-string--function--any-test-function-schema
      const { errors: errVal, values, meta } = useForm({
        validationSchema: yup.object().shape({
          containers: yup
            .array().of(
              yup.object().shape({
                name: yup.string().test({
                  name:    'required',
                  message: () => message,
                  test:    (val) => {
                    message = validators('Container name').required(val);

                    return !message;
                  }
                }),
                image: yup.string().test({
                  name:    'required',
                  message: () => message,
                  test:    (val) => {
                    message = validators('Container image').required(val);

                    return !message;
                  }
                })
              })
            )
            .strict(),
        }),
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
    created() {
      t = this.$store.getters['i18n/t'];
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
