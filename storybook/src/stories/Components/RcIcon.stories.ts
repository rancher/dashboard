import type { Meta, StoryObj } from '@storybook/vue3';
import { RcIcon } from '@components/RcIcon';
import { RcIconTypeToClass, RcIconSizeToCSS } from '@components/RcIcon/types';
import { StatusDefinitions } from '@components/utils/status';

const meta: Meta<typeof RcIcon> = {
  component: RcIcon,
  argTypes:  {
    type: {
      options:     Object.keys(RcIconTypeToClass),
      control:     { type: 'select' },
      description: `Determines which icon will be shown.`
    },
    size: {
      options:     Object.keys(RcIconSizeToCSS),
      control:     { type: 'select' },
      description: "Determines the size of the icon. `small`, `medium`, and `large` are the standard sizes and 'inherit' should be used if you plan to style it yourself. We highly discourage using `inherit` we'd like to limit the amount of sizes we use."
    },
    status: {
      options:     [...Object.keys(StatusDefinitions), 'inherit'],
      control:     { type: 'select' },
      description: 'Determines the color of the text based on the status used. This value can also be `inherit` which means that the color should inherit the text of the surrounding text.'
    },
  }
};

export default meta;
type Story = StoryObj<typeof RcIcon>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcIcon },
    setup() {
      return { args };
    },
    template: '<RcIcon v-bind="args" />',
  }),
  args: {
    type:   'search',
    size:   'large',
    status: 'success'
  },
};

export const All: Story = {
  render: (args: any) => ({
    components: { RcIcon },
    setup() {
      return { args, types: Object.keys(RcIconTypeToClass) };
    },
    template: `<div style="display: flex; max-width: 100%; flex-wrap: wrap; ">
      <div v-for="type in types" :key="type" style="display: inline-flex; justify-content: center; align-items: center; flex-direction: column; flex-basis: 25%; margin-bottom: 20px;">

        <RcIcon :type="type" size="large" status="inherit" style="margin-bottom: 5px;"/>

        <span style="user-select: all;">{{type}}</span>
      </div>
    </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};
