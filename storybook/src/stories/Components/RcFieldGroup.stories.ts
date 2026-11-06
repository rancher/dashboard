import type { Meta, StoryObj } from '@storybook/vue3';
import { defineComponent, ref } from 'vue';
import { RcFieldGroup, provideFieldState } from '@components/RcField';
import { RcInput, RcInputPassword, RcInputUnit } from '@components/RcInput';
import { RcButton } from '@components/RcButton';

const column = 'display: flex; flex-direction: column; gap: 24px; max-width: 400px;';
const toolbar = 'display: flex; gap: 8px; margin-bottom: 24px;';
const section = 'display: flex; flex-direction: column; gap: 24px; padding: 16px; border: 1px dashed var(--border); border-radius: 4px;';

const meta: Meta<typeof RcFieldGroup> = {
  component: RcFieldGroup,
  argTypes:  {
    mode: {
      options:     ['edit', 'view'],
      control:     { type: 'select' },
      description: 'The mode every field inside receives. Unset, it comes from an enclosing group, or `edit` outside one.',
    },
    disabled: {
      control:     { type: 'boolean' },
      description: 'The disabled state every field inside receives. Unset, it comes from an enclosing group.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcFieldGroup>;

export const Default: Story = {
  render: (args: any) => ({
    components: {
      RcFieldGroup, RcInput, RcInputPassword, RcInputUnit
    },
    setup() {
      return {
        args, name: ref('my-cluster'), token: ref('hunter2'), memory: ref('512')
      };
    },
    template: `
      <RcFieldGroup v-bind="args">
        <div style="${ column }">
          <RcInput v-model="name" label="Name" helper-text="Lowercase letters only." required clearable />
          <RcInputPassword v-model="token" label="Token" />
          <RcInputUnit v-model="memory" label="Memory" unit="MiB" />
        </div>
      </RcFieldGroup>`,
  }),
  args: { mode: 'edit', disabled: false },
};

/**
 * Switching modes leaves every value where it was, so the page does not
 * reflow. A field that sets its own `mode` or `disabled` keeps it.
 */
export const ToggleModeAndDisabled: Story = {
  render: () => ({
    components: {
      RcFieldGroup, RcInput, RcInputPassword, RcInputUnit, RcButton
    },
    setup() {
      return {
        isView:     ref(false),
        isDisabled: ref(false),
        name:       ref('my-cluster'),
        token:      ref('hunter2'),
        memory:     ref('512'),
        note:       ref('Always editable'),
        id:         ref('c-m-8x2k'),
      };
    },
    template: `
      <div style="${ toolbar }">
        <RcButton variant="secondary" @click="isView = !isView">{{ isView ? 'Edit' : 'View' }}</RcButton>
        <RcButton variant="secondary" @click="isDisabled = !isDisabled">{{ isDisabled ? 'Enable' : 'Disable' }}</RcButton>
      </div>
      <RcFieldGroup :mode="isView ? 'view' : 'edit'" :disabled="isDisabled">
        <div style="${ column }">
          <RcInput v-model="name" label="Name" helper-text="Lowercase letters only." required clearable />
          <RcInputPassword v-model="token" label="Token" />
          <RcInputUnit v-model="memory" label="Memory" unit="MiB" />
          <RcInput v-model="note" label="Sets mode=&quot;edit&quot;, so never enters view mode" mode="edit" />
          <RcInput v-model="id" label="Sets disabled, so is never editable" disabled />
        </div>
      </RcFieldGroup>`,
  }),
};

/**
 * An inner group inherits whatever it leaves unset. Here the outer group sets
 * the mode for the whole form while the inner one disables a single section.
 */
export const NestedGroups: Story = {
  render: () => ({
    components: {
      RcFieldGroup, RcInput, RcButton
    },
    setup() {
      return {
        isView: ref(false), name: ref('my-cluster'), registry: ref('registry.example.com'), user: ref('admin')
      };
    },
    template: `
      <div style="${ toolbar }">
        <RcButton variant="secondary" @click="isView = !isView">{{ isView ? 'Edit' : 'View' }}</RcButton>
      </div>
      <RcFieldGroup :mode="isView ? 'view' : 'edit'">
        <div style="${ column }">
          <RcInput v-model="name" label="Name" />
          <RcFieldGroup disabled>
            <div style="${ section }">
              <RcInput v-model="registry" label="Registry" helper-text="Managed by the cluster's provider." />
              <RcInput v-model="user" label="Registry user" />
            </div>
          </RcFieldGroup>
        </div>
      </RcFieldGroup>`,
  }),
};

const ResourceForm = defineComponent({
  props: { mode: { type: String, default: 'edit' } },
  setup(props) {
    provideFieldState({ mode: () => (props.mode === 'view' ? 'view' : 'edit') });
  },
  template: `<form style="${ column }" @submit.prevent><slot /></form>`,
});

/**
 * A form component can call `provideFieldState` itself rather than wrapping
 * its content in an RcFieldGroup. This one maps the dashboard's
 * `create`, `edit` and `view` modes onto the field modes.
 */
export const ProvidedByAComposable: Story = {
  render: () => ({
    components: {
      ResourceForm, RcInput, RcInputUnit, RcButton
    },
    setup() {
      return {
        modes: ['create', 'edit', 'view'], mode: ref('create'), name: ref('nginx'), replicas: ref('3')
      };
    },
    template: `
      <div style="${ toolbar }">
        <RcButton v-for="m in modes" :key="m" :variant="m === mode ? 'primary' : 'secondary'" @click="mode = m">{{ m }}</RcButton>
      </div>
      <ResourceForm :mode="mode">
        <RcInput v-model="name" label="Name" required />
        <RcInputUnit v-model="replicas" label="Replicas" unit="pods" />
      </ResourceForm>`,
  }),
};
