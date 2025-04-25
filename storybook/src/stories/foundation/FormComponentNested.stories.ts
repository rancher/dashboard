import type { Meta, StoryObj } from '@storybook/vue3';
import { Form, Field, FieldArray } from 'vee-validate';
import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

const meta: Meta = {};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args: any) => ({
    components: {
      Form, Field, FieldArray, Tab, Tabbed, LabeledInput
    },
    template: `
      <Form v-slot="{ errors }">
        <Tabbed v-bind="args">
          <FieldArray name="links" v-slot="{ containers, push, remove }">
            <Tab
              v-for="(container, i) in containers"
              :key="container.key"
              :name="'Container ' + (i + 1)"
              :displayAlertIcon=""
            >
              <Tabbed :useHash=${ args.useHash } :sideTabs=${ true }>
                <Tab
                  name="name"
                  label="Name settings"
                  :displayAlertIcon=""
                >
                  <Field
                    :name="'links[' + i +'].name'"
                    value=""
                    :rules="(value) => value && value.trim() ? true : 'This is required'"
                    v-slot="{ field, meta }"
                  >
                    <LabeledInput
                      name="'links[' + i +'].name'"
                      v-bind="name"
                      :subLabel="meta.errors.join(', ')"
                      :status="!!meta.errors.length ? 'error' : meta.touched ? 'success' : undefined"
                      :tooltipKey="!!meta.errors.length ? meta.errors.join(', ') : meta.touched ? 'Input correct' : undefined"
                    />
                  </Field>
                </Tab>
                <Tab
                  name="image"
                  label="Image settings"
                  :displayAlertIcon=""
                >
                  <Field
                    name="'links[' + i +'].image'"
                    value=""
                    :rules="(value) => value && value.trim() ? true : 'This is required'"
                    v-slot="{ field, meta }"
                  >
                    <LabeledInput
                      name="'links[' + i +'].image'"
                      v-bind="'links[' + i +'].image'"
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

            <template #tab-row-extras>
              <li class="tablist-controls">
                <button @click="push({ name: '', image: '' })">Add container</button>
              </li>
            </template>
          </FieldArray>
        </Tabbed>
      </Form>
    `,
  }),
};
