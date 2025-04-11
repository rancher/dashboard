import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';
import type { Meta, StoryObj } from '@storybook/vue3';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { useForm, useFieldArray } from 'vee-validate';

const meta: Meta = {};

export default meta;
type Story = StoryObj;

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
    components: {
      Tab, Tabbed, LabeledInput
    },
    setup() {
      const { errors: errVal, values, meta } = useForm({ initialValues: { containers: [{ name: '1' }, { name: '2' }] } });
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
    template: `
    <Tabbed v-bind="args">
      <Tab
        v-for="(container, i) in containers"
        :key="container.key"
        :name="'Container ' + (i + 1)"
      >
      <div>
        <LabeledInput
          v-model:value="container.value.name"
          label="Container name"
          type="text"
          :subLabel="errVal.containers ? errVal.containers[i].name : ''"
          :status="errVal.containers && errVal.containers[i].name ? 'error' : meta.touched ? 'success' : undefined"
          :tooltipKey="errVal.containers && errVal.containers[i].name ? errVal.containers[i].name : meta.touched ? 'Input correct' : undefined"
        />
        <br />
        <button @click="removeContainer(i)">Remove</button>
      </div>
      </Tab>
      <template #tab-row-extras>
        <li class="tablist-controls">
          <button @click="addContainer({ name: containers.length + 1 })">Add container</button>
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
