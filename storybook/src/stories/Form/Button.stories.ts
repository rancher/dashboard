import type { Meta, StoryObj } from '@storybook/vue3';
import AsyncButton from '@shell/components/AsyncButton';

const meta: Meta<typeof AsyncButton> = { component: AsyncButton };

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
  args: { actionLabel: 'Click me' },
};

// Phases

export const PhaseAction: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase action',
    currentPhase: `action`
  },
};

export const PhaseWaiting: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase waiting',
    currentPhase: `waiting`
  },
};

export const PhaseSuccess: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase success',
    currentPhase: `success`
  },
};

export const PhaseError: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase error',
    currentPhase: `error`
  },
};

// Phases class

export const PhaseClassAction: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase action',
    actionColor:  `action`,
    currentPhase: `action`
  },
};

export const PhaseClassWaiting: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase waiting',
    actionColor:  `waiting`,
    currentPhase: `waiting`
  },
};

export const PhaseClassSuccess: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase success',
    actionColor:  `success`,
    currentPhase: `success`
  },
};

export const PhaseClassError: Story = {
  ...Default,
  args: {
    actionLabel:  'Phase error',
    actionColor:  `error`,
    currentPhase: `error`
  },
};

export const PhaseLabelAction: Story = {
  ...Default,
  args: {
    actionLabel:  'Custom action label',
    currentPhase: 'action'
  },
};

export const PhaseLabelWaiting: Story = {
  ...Default,
  args: {
    waitingLabel: 'Custom waiting label',
    currentPhase: 'waiting'
  },
};

export const PhaseLabelSuccess: Story = {
  ...Default,
  args: {
    successLabel: 'Custom success label',
    currentPhase: 'success'
  },
};

export const PhaseLabelError: Story = {
  ...Default,
  args: {
    errorLabel:   'Custom error label',
    currentPhase: 'error'
  },
};

// #### Manual Phases

export const Manual: Story = {
  ...Default,
  args: {
    actionLabel: 'Manual phase',
    manual:      true
  },
};

// ### Modes

export const ModeEdit: Story = {
  ...Default,
  args: {
    actionLabel: 'Edit mode',
    mode:        'edit'
  },
};

export const ModeContinue: Story = {
  ...Default,
  args: {
    actionLabel: 'Continue mode',
    mode:        'continue'
  },
};

export const ModeApply: Story = {
  ...Default,
  args: {
    actionLabel: 'Apply mode',
    mode:        'apply'
  },
};

// ### Delay

export const Delay: Story = {
  ...Default,
  args: {
    actionLabel: 'Delay',
    delay:       3000
  },
};

// ### Disabled

export const Disabled: Story = {
  ...Default,
  args: {
    actionLabel: 'Disabled',
    disabled:    true
  },
};

// ### Types

export const TypeSubmit: Story = {
  ...Default,
  args: {
    actionLabel: 'Submit',
    type:        'submit'
  },
};

export const TypeButton: Story = {
  ...Default,
  args: {
    actionLabel: 'Button',
    type:        'button'
  },
};

// ### Icon

export const Icon: Story = {
  ...Default,
  args: {
    actionLabel: 'With icon',
    icon:        'check'
  },
};

// ### Size

export const SizeSm: Story = {
  ...Default,
  args: {
    actionLabel: 'Small size',
    size:        'sm'
  },
};
