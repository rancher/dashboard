import type { Meta, StoryObj } from '@storybook/vue3';
import { RcAccordion } from '@components/RcAccordion';
import { RcAccordionVariant } from '@components/RcAccordion/types';
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';
import RcCounterBadge from '@components/Pill/RcCounterBadge/RcCounterBadge.vue';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge.vue';

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
    title:      'Section Title',
    variant:    'primary',
    modelValue: true,
  },
};

export const Variants: Story = {
  render: () => ({
    components: { RcAccordion },
    template:   `<div style="display: flex; flex-direction: column; gap: 16px; max-width: 800px;">
        <RcAccordion title="Primary Variant" variant="primary" :model-value="true">
          <p>Primary variant has a white background. Use this for top-level accordions.</p>
        </RcAccordion>
        <RcAccordion title="Secondary Variant" variant="secondary" :model-value="true">
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
        <RcAccordion title="Already expanded" variant="primary" :model-value="true">
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
    components: {
      RcAccordion, RcCounterBadge, RcStatusBadge, RcIcon
    },
    template: `<div style="display: flex; flex-direction: column; gap: 16px; max-width: 800px;">
        <RcAccordion title="Machine Pools" variant="primary" :model-value="true">
          <template #notifications>
            <RcCounterBadge :count="2" type="inactive" />
            <RcIcon type="error" status="error" size="large" />
          </template>
          <template #actions>
            <RcStatusBadge status="warning">1 etcd</RcStatusBadge>
            <RcStatusBadge status="warning">1 control plane</RcStatusBadge>
            <RcStatusBadge status="warning">1 worker</RcStatusBadge>
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
    components: { RcAccordion, RcButton, RcIcon, RcCounterBadge },
    template:   `<div style="max-width: 800px;">
        <RcAccordion title="Machine Pools" variant="primary" :model-value="true">
          <template #notifications>
            <RcCounterBadge :count="2" type="inactive" />
          </template>
          <div style="display: flex; flex-direction: column; gap: 16px; padding-left: 24px;">
            <RcAccordion title="Control" variant="secondary" :model-value="true">
              <template #actions>
                <RcButton variant="ghost">
                  <RcIcon type="copy" size="medium" />
                </RcButton>
                <RcButton variant="ghost">
                  <RcIcon type="trash" size="medium" />
                </RcButton>
              </template>
              <p>Control pool configuration content goes here.</p>
            </RcAccordion>
            <RcAccordion title="Workers" variant="secondary" :model-value="true">
              <template #actions>
                <RcButton variant="ghost">
                  <RcIcon type="copy" size="medium" />
                </RcButton>
                <RcButton variant="ghost">
                  <RcIcon type="trash" size="medium" />
                </RcButton>
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
