import type { Meta, StoryObj } from '@storybook/vue3';
import { RcProgressBar } from '@components/RcProgressBar';
import { RC_PROGRESS_BAR_SIZES } from '@components/RcProgressBar/types';
import { BarSeverityColors, BarStatusColors } from '@components/utils/barColors';

const statusColors = Object.keys(BarStatusColors);
const severityColors = Object.keys(BarSeverityColors);
const codeList = (names: string[]) => names.map((name) => `\`${ name }\``).join(', ');

const meta: Meta<typeof RcProgressBar> = {
  component:  RcProgressBar,
  parameters: {
    docs: {
      description: {
        component: `A horizontal bar showing how far a value has progressed between \`min\` and \`max\`, filled from the left.

The fill is blue (\`info\`) by default. Set \`color\` to another named color from the status or severity palette, or to the name of a CSS custom property such as \`--primary\`, when the context calls for it.

The bar renders \`role="progressbar"\` with \`aria-valuenow\`, \`aria-valuemin\` and \`aria-valuemax\`. Every progress bar needs an accessible name that says what is progressing: pass \`ariaLabel\`, or an \`aria-labelledby\` attribute pointing at a visible label. Use \`ariaValuetext\` when the raw number is not meaningful on its own, for example "3 of 8 nodes ready".

Values outside the range are clamped, and a \`max\` that is not greater than \`min\` shows an empty bar.`,
      },
    },
  },
  argTypes: {
    value: {
      control:     { type: 'number' },
      description: 'The current progress. Clamped to the range between `min` and `max`.',
    },
    min: {
      control:     { type: 'number' },
      description: 'The value at which the bar is empty. Defaults to `0`.',
    },
    max: {
      control:     { type: 'number' },
      description: 'The value at which the bar is full. Defaults to `100`.',
    },
    size: {
      options:     [...RC_PROGRESS_BAR_SIZES],
      table:       { type: { summary: RC_PROGRESS_BAR_SIZES.map((size) => `'${ size }'`).join(' | ') } },
      control:     { type: 'select' },
      description: 'Height of the bar: `small` is 4px and `medium` is 7px. Defaults to `small`.',
    },
    color: {
      options:     [...statusColors, ...severityColors, '--primary'],
      control:     { type: 'select' },
      description: `Color of the fill. Defaults to \`info\`.

- Status: ${ codeList(statusColors) }
- Severity: ${ codeList(severityColors) }
- Any CSS custom property name, such as \`--primary\``,
      table: { type: { summary: [...statusColors, ...severityColors].map((name) => `'${ name }'`).concat('`--name`').join(' | ') } },
    },
    ariaLabel: {
      control:     { type: 'text' },
      description: 'Accessible name describing what is progressing. Provide this or an `aria-labelledby` attribute.',
    },
    ariaValuetext: {
      control:     { type: 'text' },
      description: 'Human readable text for the current value, read in place of the number.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcProgressBar>;

const defaultTemplate = `<div style="width: 300px;">
  <RcProgressBar v-bind="args" />
</div>`;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcProgressBar },
    setup() {
      return { args };
    },
    template: defaultTemplate,
  }),
  args: {
    value: 40, min: 0, max: 100, size: 'small', ariaLabel: 'Upgrade progress'
  },
  parameters: {
    docs: {
      canvas: { sourceState: 'shown' },
      source: { code: defaultTemplate },
    },
  },
};

const sizesTemplate = `<div style="display: flex; flex-direction: column; gap: 20px; width: 300px;">
  <RcProgressBar size="small" :value="60" aria-label="Small progress bar" />
  <RcProgressBar size="medium" :value="60" aria-label="Medium progress bar" />
</div>`;

export const Sizes: Story = {
  render: () => ({
    components: { RcProgressBar },
    template:   sizesTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'The `small` (4px) and `medium` (7px) sizes. Both take the full width of their container.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: sizesTemplate },
    },
  },
};

const valuesTemplate = `<div style="display: flex; flex-direction: column; gap: 20px; width: 300px;">
  <RcProgressBar size="medium" :value="0" aria-label="Not started" />
  <RcProgressBar size="medium" :value="25" aria-label="A quarter done" />
  <RcProgressBar size="medium" :value="75" aria-label="Three quarters done" />
  <RcProgressBar size="medium" :value="100" aria-label="Complete" />
</div>`;

export const Values: Story = {
  render: () => ({
    components: { RcProgressBar },
    template:   valuesTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'Empty, partly filled and full bars. At `0` only the track shows.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: valuesTemplate },
    },
  },
};

const rangeTemplate = `<div style="width: 300px;">
  <RcProgressBar
    size="medium"
    :value="3"
    :max="8"
    aria-label="Nodes ready"
    aria-valuetext="3 of 8 nodes ready"
  />
</div>`;

export const CustomRange: Story = {
  render: () => ({
    components: { RcProgressBar },
    template:   rangeTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'A count against a total, with `ariaValuetext` so assistive technology reads "3 of 8 nodes ready" rather than the bare number.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: rangeTemplate },
    },
  },
};

const colorTemplate = `<div style="display: flex; flex-direction: column; gap: 20px; width: 300px;">
  <RcProgressBar size="medium" :value="60" color="success" aria-label="Success" />
  <RcProgressBar size="medium" :value="60" color="warning" aria-label="Warning" />
  <RcProgressBar size="medium" :value="60" color="error" aria-label="Error" />
  <RcProgressBar size="medium" :value="60" color="--primary" aria-label="Primary" />
</div>`;

const labeledByTemplate = `<div style="display: flex; flex-direction: column; gap: 8px; width: 300px;">
  <span id="upgrade-progress-label">Upgrading cluster</span>
  <RcProgressBar size="medium" :value="45" aria-labelledby="upgrade-progress-label" />
</div>`;

export const LabeledByVisibleText: Story = {
  render: () => ({
    components: { RcProgressBar },
    template:   labeledByTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'When a visible label sits next to the bar, point `aria-labelledby` at it instead of repeating the text in `ariaLabel`.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: labeledByTemplate },
    },
  },
};

export const CustomColor: Story = {
  render: () => ({
    components: { RcProgressBar },
    template:   colorTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'Blue is the default, but the fill can use any named palette color or a CSS custom property, depending on context.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: colorTemplate },
    },
  },
};
