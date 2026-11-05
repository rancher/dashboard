import type { Meta, StoryObj } from '@storybook/vue3';
import { onMounted, onUnmounted, ref } from 'vue';
import { RcSegmentationBar } from '@components/RcSegmentationBar';
import { RC_SEGMENTATION_BAR_SIZES } from '@components/RcSegmentationBar/types';
import type { RcSegment } from '@components/RcSegmentationBar/types';
import { BarSeverityColors, BarStatusColors } from '@components/utils/barColors';

const statusColors = Object.keys(BarStatusColors);
const severityColors = Object.keys(BarSeverityColors);
const codeList = (names: string[]) => names.map((name) => `\`${ name }\``).join(', ');

const statusSegments: RcSegment[] = [
  {
    value: 3, color: 'error', label: 'Error'
  },
  {
    value: 5, color: 'warning', label: 'Warning'
  },
  {
    value: 2, color: 'unknown', label: 'Unknown'
  },
  {
    value: 4, color: 'info', label: 'Info'
  },
  {
    value: 12, color: 'success', label: 'Success'
  },
];

const meta: Meta<typeof RcSegmentationBar> = {
  component:  RcSegmentationBar,
  parameters: {
    docs: {
      description: {
        component: `A horizontal bar showing how a total splits across status values or severity levels.

Each segment's width is proportional to its \`value\`, and the visible segments always stretch to cover the full width. Segments with a value of zero or less are not shown, so you can hide some values; the remaining ones fill the bar.

Colors come from two palettes:

- **Status**: \`error\`, \`warning\`, \`unknown\`, \`info\`, \`success\`
- **Severity**: \`critical\`, \`high\`, \`medium\`, \`low\`, \`none\`

The bar renders \`role="img"\` with an accessible name that summarizes the visible segments (for example "Error: 3, Warning: 5"). Pass \`ariaLabel\` to replace it. A bar with no visible segments and no \`ariaLabel\` is hidden from assistive technology.`,
      },
    },
  },
  argTypes: {
    segments: {
      control:     { type: 'object' },
      description: `The segments to show, from left to right. Each has a \`value\`, a \`color\` and a translated \`label\`. \`color\` is one of:

- Status: ${ codeList(statusColors) }
- Severity: ${ codeList(severityColors) }`,
    },
    size: {
      options:     [...RC_SEGMENTATION_BAR_SIZES],
      table:       { type: { summary: RC_SEGMENTATION_BAR_SIZES.map((size) => `'${ size }'`).join(' | ') } },
      control:     { type: 'select' },
      description: 'Height of the bar: `small` is 4px and `medium` is 7px. Defaults to `small`.',
    },
    ariaLabel: {
      control:     { type: 'text' },
      description: 'Accessible name for the bar. Defaults to a summary of the visible segments.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcSegmentationBar>;

const defaultTemplate = `<div style="width: 300px;">
  <RcSegmentationBar v-bind="args" />
</div>`;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcSegmentationBar },
    setup() {
      return { args };
    },
    template: defaultTemplate,
  }),
  args:       { segments: statusSegments, size: 'small' },
  parameters: {
    docs: {
      canvas: { sourceState: 'shown' },
      source: { code: defaultTemplate },
    },
  },
};

const sizesTemplate = `<div style="display: flex; flex-direction: column; gap: 20px; width: 300px;">
  <RcSegmentationBar size="small" :segments="[
    { value: 3, color: 'error', label: 'Error' },
    { value: 5, color: 'warning', label: 'Warning' },
    { value: 12, color: 'success', label: 'Success' },
  ]" />
  <RcSegmentationBar size="medium" :segments="[
    { value: 3, color: 'error', label: 'Error' },
    { value: 5, color: 'warning', label: 'Warning' },
    { value: 12, color: 'success', label: 'Success' },
  ]" />
</div>`;

export const Sizes: Story = {
  render: () => ({
    components: { RcSegmentationBar },
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

const statusTemplate = `<div style="width: 300px;">
  <RcSegmentationBar size="medium" :segments="[
    { value: 3, color: 'error', label: 'Error' },
    { value: 5, color: 'warning', label: 'Warning' },
    { value: 2, color: 'unknown', label: 'Unknown' },
    { value: 4, color: 'info', label: 'Info' },
    { value: 12, color: 'success', label: 'Success' },
  ]" />
</div>`;

export const StatusPalette: Story = {
  render: () => ({
    components: { RcSegmentationBar },
    template:   statusTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'The status palette, in its intended order: error, warning, unknown, info and success.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: statusTemplate },
    },
  },
};

const severityTemplate = `<div style="width: 300px;">
  <RcSegmentationBar size="medium" :segments="[
    { value: 1, color: 'critical', label: 'Critical' },
    { value: 4, color: 'high', label: 'High' },
    { value: 6, color: 'medium', label: 'Medium' },
    { value: 9, color: 'low', label: 'Low' },
    { value: 5, color: 'none', label: 'None' },
  ]" />
</div>`;

export const SeverityPalette: Story = {
  render: () => ({
    components: { RcSegmentationBar },
    template:   severityTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'The severity palette, in its intended order: critical, high, medium, low and none.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: severityTemplate },
    },
  },
};

const hiddenTemplate = `<div style="display: flex; flex-direction: column; gap: 20px; width: 300px;">
  <RcSegmentationBar size="medium" :segments="[
    { value: 3, color: 'error', label: 'Error' },
    { value: 0, color: 'warning', label: 'Warning' },
    { value: 0, color: 'unknown', label: 'Unknown' },
    { value: 0, color: 'info', label: 'Info' },
    { value: 12, color: 'success', label: 'Success' },
  ]" />
  <RcSegmentationBar size="medium" :segments="[
    { value: 0, color: 'critical', label: 'Critical' },
    { value: 0, color: 'high', label: 'High' },
    { value: 6, color: 'medium', label: 'Medium' },
    { value: 0, color: 'low', label: 'Low' },
    { value: 0, color: 'none', label: 'None' },
  ]" />
</div>`;

export const HiddenSegments: Story = {
  render: () => ({
    components: { RcSegmentationBar },
    template:   hiddenTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'Segments with a value of zero are not shown, and the remaining segments stretch to cover the bar. They are also left out of the accessible name.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: hiddenTemplate },
    },
  },
};

const labelTemplate = `<div style="width: 300px;">
  <RcSegmentationBar
    size="medium"
    aria-label="Image scan: 1 critical, 4 high, 6 medium vulnerabilities"
    :segments="[
      { value: 1, color: 'critical', label: 'Critical' },
      { value: 4, color: 'high', label: 'High' },
      { value: 6, color: 'medium', label: 'Medium' },
    ]"
  />
</div>`;

export const CustomAccessibleName: Story = {
  render: () => ({
    components: { RcSegmentationBar },
    template:   labelTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'Pass `ariaLabel` when the generated summary does not describe the bar well enough, for example to say what is being counted.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: labelTemplate },
    },
  },
};

const statusSteps: number[][] = [
  [0, 0, 8, 2, 0],
  [1, 2, 3, 3, 1],
  [1, 1, 0, 2, 6],
  [0, 0, 0, 0, 10],
];

const transitionsTemplate = `<div style="width: 300px;">
  <RcSegmentationBar size="medium" :segments="segments" />
</div>`;

export const Transitions: Story = {
  tags:   ['!autodocs'],
  render: () => ({
    components: { RcSegmentationBar },
    setup() {
      const toSegments = (values: number[]): RcSegment[] => statusSegments.map((segment, i) => ({ ...segment, value: values[i] }));
      const segments = ref(toSegments(statusSteps[0]));
      let timer: ReturnType<typeof setInterval>;

      onMounted(() => {
        let step = 0;

        timer = setInterval(() => {
          step = (step + 1) % statusSteps.length;
          segments.value = toSegments(statusSteps[step]);
        }, 2000);
      });

      onUnmounted(() => clearInterval(timer));

      return { segments };
    },
    template: transitionsTemplate,
  }),
  parameters: {
    controls: { disable: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: transitionsTemplate },
    },
  },
};
