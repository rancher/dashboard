import type { Meta, StoryObj } from '@storybook/vue3';
import AsyncButton from '@shell/components/AsyncButton';

const meta: Meta<typeof AsyncButton> = {
  component: AsyncButton,
};
 
export default meta;
type Story = StoryObj<typeof AsyncButton>;

export const Default: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Click me'
  },
};

// Phases

export const PhaseAction: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase action',
    currentPhase: `action`
  },
};

export const PhaseWaiting: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase waiting',
    currentPhase: `waiting`
  },
};

export const PhaseSuccess: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase success',
    currentPhase: `success`
  },
};

export const PhaseError: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase error',
    currentPhase: `error`
  },
};

// Phases class

export const PhaseClassAction: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase action',
    actionColor: `action`,
    currentPhase: `action`
  },
};

export const PhaseClassWaiting: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase waiting',
    actionColor: `waiting`,
    currentPhase: `waiting`
  },
};

export const PhaseClassSuccess: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase success',
    actionColor: `success`,
    currentPhase: `success`
  },
};

export const PhaseClassError: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Phase error',
    actionColor: `error`,
    currentPhase: `error`
  },
};

export const PhaseLabelAction: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Custom action label',
    currentPhase: 'action'
  },
};

export const PhaseLabelWaiting: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    waitingLabel: 'Custom waiting label',
    currentPhase: 'waiting'
  },
};

export const PhaseLabelSuccess: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    successLabel: 'Custom success label',
    currentPhase: 'success'
  },
};

export const PhaseLabelError: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    errorLabel: 'Custom error label',
    currentPhase: 'error'
  },
};

// #### Manual Phases

export const Manual: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Manual phase',
    manual: true
  },
};

// ### Modes

export const ModeEdit: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Edit mode',
    mode: 'edit'
  },
};

export const ModeContinue: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Continue mode',
    mode: 'continue'
  },
};

export const ModeApply: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Apply mode',
    mode: 'apply'
  },
};

// ### Delay

export const Delay: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Delay',
    delay: 3000
  },
};

// ### Disabled

export const Disabled: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Disabled',
    disabled: true
  },
};

// ### Types

export const TypeSubmit: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Submit',
    type: 'submit'
  },
};

export const TypeButton: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Button',
    type: 'button'
  },
};

// ### Icon

export const Icon: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'With icon',
    icon: 'check'
  },
};

// ### Size

export const SizeSm: Story = {
  render: (args: any) => ({
    components: { AsyncButton },
    setup() {
      return { args };
    },
    template: '<AsyncButton v-bind="args" />',
  }),
  args: {
    actionLabel: 'Small size',
    size: 'sm'
  },
};
