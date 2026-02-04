import type { Meta, StoryObj } from '@storybook/vue3';
import { RcAccordion } from '@components/RcAccordion';
import { RcAccordionVariant } from '@components/RcAccordion/types';

const meta: Meta<typeof RcAccordion> = {
  component: RcAccordion,
  argTypes:  {
    title: {
      control:     { type: 'text' },
      description: 'The title displayed in the accordion header.'
    },
    variant: {
      options:     ['primary', 'secondary'] as RcAccordionVariant[],
      control:     { type: 'select' },
      description: 'Visual variant determining background color. Primary has white background (for top-level accordions), secondary has light gray background (for nested accordions).'
    },
    modelValue: {
      control:     { type: 'boolean' },
      description: 'Controls the expanded/collapsed state. Use with v-model for two-way binding.'
    },
    openInitially: {
      control:     { type: 'boolean' },
      description: 'Initial expanded state when not using v-model. Only used on mount.'
    },
  }
};

export default meta;
type Story = StoryObj<typeof RcAccordion>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcAccordion },
    setup() {
      return { args };
    },
    template: `<RcAccordion v-bind="args">
        <p>This is the accordion content. It can contain any content you want.</p>
      </RcAccordion>`,
  }),
  args: {
    title:         'Section Title',
    variant:       'primary',
    openInitially: true,
  },
};

export const Variants: Story = {
  render: () => ({
    components: { RcAccordion },
    template:   `<div style="display: flex; flex-direction: column; gap: 16px; max-width: 800px;">
        <RcAccordion title="Primary Variant" variant="primary" open-initially>
          <p>Primary variant has a white background. Use this for top-level accordions.</p>
        </RcAccordion>
        <RcAccordion title="Secondary Variant" variant="secondary" open-initially>
          <p>Secondary variant has a light gray background. Use this for nested accordions.</p>
        </RcAccordion>
      </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const CollapsedState: Story = {
  render: () => ({
    components: { RcAccordion },
    template:   `<div style="display: flex; flex-direction: column; gap: 16px; max-width: 800px;">
        <RcAccordion title="Click to expand" variant="primary">
          <p>This accordion starts collapsed.</p>
        </RcAccordion>
        <RcAccordion title="Already expanded" variant="primary" open-initially>
          <p>This accordion starts expanded.</p>
        </RcAccordion>
      </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const WithHeaderSlots: Story = {
  render: () => ({
    components: { RcAccordion },
    template:   `<div style="display: flex; flex-direction: column; gap: 16px; max-width: 800px;">
        <RcAccordion title="Machine Pools" variant="primary" open-initially>
          <template #header-left>
            <span style="background: #f4f5fb; padding: 1px 8px; border-radius: 30px; font-size: 13px;">2</span>
          </template>
          <template #header-right>
            <span style="background: #ffe47a; color: #473900; padding: 1px 8px; border-radius: 30px; font-size: 12px;">1 etcd</span>
            <span style="background: #ffe47a; color: #473900; padding: 1px 8px; border-radius: 30px; font-size: 12px;">1 control plane</span>
            <span style="background: #ffe47a; color: #473900; padding: 1px 8px; border-radius: 30px; font-size: 12px;">1 worker</span>
          </template>
          <p>Accordion content with header slots for badges and status indicators.</p>
        </RcAccordion>
      </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const NestedAccordions: Story = {
  render: () => ({
    components: { RcAccordion },
    template:   `<div style="max-width: 800px;">
        <RcAccordion title="Machine Pools" variant="primary" open-initially>
          <template #header-left>
            <span style="background: #f4f5fb; padding: 1px 8px; border-radius: 30px; font-size: 13px;">2</span>
          </template>
          <div style="display: flex; flex-direction: column; gap: 16px; padding-left: 24px;">
            <RcAccordion title="Control" variant="secondary" open-initially>
              <template #header-right>
                <button style="background: none; border: none; cursor: pointer; padding: 4px;">
                  <i class="icon icon-copy" style="font-size: 18px;" />
                </button>
                <button style="background: none; border: none; cursor: pointer; padding: 4px;">
                  <i class="icon icon-trash" style="font-size: 18px;" />
                </button>
              </template>
              <p>Control pool configuration content goes here.</p>
            </RcAccordion>
            <RcAccordion title="Workers" variant="secondary">
              <template #header-right>
                <button style="background: none; border: none; cursor: pointer; padding: 4px;">
                  <i class="icon icon-copy" style="font-size: 18px;" />
                </button>
                <button style="background: none; border: none; cursor: pointer; padding: 4px;">
                  <i class="icon icon-trash" style="font-size: 18px;" />
                </button>
              </template>
              <p>Workers pool configuration content goes here.</p>
            </RcAccordion>
          </div>
        </RcAccordion>
      </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};

export const WithVModel: Story = {
  render: () => ({
    components: { RcAccordion },
    data() {
      return { isExpanded: true };
    },
    template: `<div style="max-width: 800px;">
        <div style="margin-bottom: 16px;">
          <label>
            <input type="checkbox" v-model="isExpanded" />
            Accordion is expanded: {{ isExpanded }}
          </label>
        </div>
        <RcAccordion title="Controlled Accordion" variant="primary" v-model="isExpanded">
          <p>This accordion's state is controlled via v-model.</p>
        </RcAccordion>
      </div>`,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } }
  },
};
