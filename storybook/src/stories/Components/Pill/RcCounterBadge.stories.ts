import type { Meta, StoryObj } from '@storybook/vue3';
import RcCounterBadge from '@components/Pill/RcCounterBadge/RcCounterBadge.vue';

const meta: Meta<typeof RcCounterBadge> = {
  component: RcCounterBadge,
  argTypes:  {
    count: {
      control:     { type: 'number' },
      description: 'The count that should display in the badge'
    },
    type: {
      options:     ['active', 'inactive'],
      control:     { type: 'select' },
      description: 'Specifies the type of the tag.'
    },
    disabled: {
      control:     { type: 'boolean' },
      description: 'Specified if the tag is disabled.'
    },
    ariaLabel: {
      control:     { type: 'text' },
      description: 'Accessible name for the badge, bound as `aria-label`. Development warns when `status` is set without one.'
    },
    status: {
      options:     [undefined, 'info', 'success', 'warning', 'error', 'unknown', 'none'],
      control:     { type: 'select' },
      description: 'Colours the badge from the status palette, the same way RcStatusBadge does. When omitted the badge keeps the neutral colours of its type.'
    },
    backgroundColor: {
      control:     { type: 'text' },
      description: 'Escape hatch, strongly discouraged. Full override of the fill, any CSS colour. Leaves the palette, so it does not follow a theme or a token change. Prefer `status`, or a new status, over reaching for it.'
    },
    borderColor: {
      control:     { type: 'text' },
      description: 'Escape hatch, strongly discouraged. Full override of the border colour, see backgroundColor.'
    },
    textColor: {
      control:     { type: 'text' },
      description: 'Escape hatch, strongly discouraged. Full override of the text colour, see backgroundColor.'
    }
  }
};

export default meta;
type Story = StoryObj<typeof RcCounterBadge>;

const Default: Story = {
  render: (args: any) => ({
    components: { RcCounterBadge },
    setup() {
      return { args };
    },
    template: '<RcCounterBadge v-bind="args">{{args.default}}</RcCounterBadge>',
  }),
};

export const Example: Story = {
  ...Default,
  args: {
    type: 'inactive', disabled: false, count: 1000
  },
};

/** The status palette, read through the same composable RcStatusBadge reads it through. */
export const Status: Story = {
  ...Default,
  args: {
    type: 'inactive', disabled: false, count: 7, status: 'warning', ariaLabel: '7 clusters need attention'
  },
};

/** A full override. An escape hatch, strongly discouraged: prefer `status`, or a new status, so the badge stays in the palette. */
export const OverriddenColors: Story = {
  ...Default,
  args: {
    type:            'inactive',
    disabled:        false,
    count:           12,
    backgroundColor: 'var(--rc-info-secondary)',
    borderColor:     'var(--rc-info)',
    textColor:       'var(--rc-info)',
  },
};
