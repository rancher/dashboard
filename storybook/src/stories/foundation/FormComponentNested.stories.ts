import type { Meta, StoryObj } from '@storybook/vue3';
import { Form, Field, FieldArray } from 'vee-validate';
import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import formRulesGenerator from '@shell/utils/validators/formRules/index';

const meta: Meta = {};

export default meta;
type Story = StoryObj;

export const Template: Story = {
  render: (args: any) => ({
    components: {
      Form, Field, FieldArray, Tab, Tabbed, LabeledInput
    },
    setup() {
      return {
        args,
        initialValues: { containers: [{ name: '1', image: '' }, { name: '2', image: '' }] },
        validators:    () => {},
      };
    },
    created() {
      this.validators = (key: string) => formRulesGenerator(this.$store.getters['i18n/t'], { key });
    },
    methods: {
      /**
       * Get errors for a specific field in the form
       * @param {object} errors - The errors object from the form
       * @param {string} prefix - The prefix for the field name
       * @param {number} i - The index of the field in the array
       * @param {string} [suffix] - An optional suffix for the field name
       * @returns {Array} - An array of error messages for the specified field
       * @example
       * getErrors({
       *   "containers[0].image": "This is required"
       * }, 'containers', 0, 'name')  // returns ['This is required']
       */
      getErrors: <T extends object>(errors: T, prefix: string, i: number, suffix?: string) => Object
        .keys(errors)
        .filter((key) => key.includes(`${ prefix }[${ i }]${ suffix ? `.${ suffix }` : '' }`))
        .map((key: string) => errors[key as keyof T])

    },
    template: `
      <Form v-slot="{ errors, meta: formMeta }" :initial-values="initialValues">
        <Tabbed v-bind="args">
          <FieldArray name="containers" v-slot="{ fields, push, remove }">
            <Tab
              v-for="(container, i) in fields"
              :key="container.key"
              :name="'Container ' + (i + 1)"
              :displayAlertIcon="!!getErrors(errors, 'containers', i).length"
            >
              <Tabbed :useHash=${ args.useHash } :sideTabs=${ true }>
                <Tab
                  name="name-settings"
                  label="Name settings"
                  :displayAlertIcon="!!getErrors(errors, 'containers', i, 'name').length"
                >
                  <Field
                    :name="'containers[' + i +'].name'"
                    :rules="(value) => validators('Container name').required(value) ?? true"
                    v-slot="{ field, meta }"
                  >
                    <LabeledInput
                      :name="field"
                      v-bind="field"
                      :subLabel="meta.errors.join(', ')"
                      :status="!!meta.errors.length ? 'error' : meta.touched ? 'success' : undefined"
                      :tooltipKey="!!meta.errors.length ? meta.errors.join(', ') : meta.touched ? 'Input correct' : undefined"
                    />
                  </Field>
                </Tab>
                <Tab
                  name="image-settings"
                  label="Image settings"
                  :displayAlertIcon="!!getErrors(errors, 'containers', i, 'image').length"
                >
                  <Field
                    :name="'containers[' + i +'].image'"
                    :rules="(value) => validators('Container image').required(value) ?? true"
                    v-slot="{ field, meta }"
                  >
                    <LabeledInput
                      :name="field"
                      v-bind="field"
                      :subLabel="meta.errors.join(', ')"
                      :status="!!meta.errors.length ? 'error' : meta.touched ? 'success' : undefined"
                      :tooltipKey="!!meta.errors.length ? meta.errors.join(', ') : meta.touched ? 'Input correct' : undefined"
                    />
                  </Field>
                </Tab>
              </Tabbed>
              <br />
              <button @click="remove(i)">Remove</button>
            </Tab>
          </FieldArray>
            <template #tab-row-extras>
              <li class="tablist-controls">
                <button @click="push({ name: '', image: '' })">Add container</button>
              </li>
            </template>
        </Tabbed>
        <br />
        <br />
        <details>
          <summary>Meta</summary>
          <pre>Meta: {{ formMeta }}</pre>
          <pre>Errors: {{ errors }}</pre>
        </details>
      </Form>
    `,
  }),
};

export const Default: Story = {
  ...Template,
  args: { useHash: false },
};
