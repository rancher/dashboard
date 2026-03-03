import type { Meta, StoryObj } from '@storybook/vue3';
import { RcSection } from '@components/RcSection';
import { SectionType, SectionMode } from '@components/RcSection/types';
import { RcButton } from '@components/RcButton';
import RcStatusBadge from '@components/Pill/RcStatusBadge';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import { RcIcon } from '@components/RcIcon';
import { ref } from 'vue';

/**
 * Reusable content group markup matching the Figma spec.
 * - required (first group): 14px/700, color #6C6F76
 * - optional (subsequent):  14px/400, color #BEC1D2
 */
const contentGroup = (title: string, body: string, required = false) => {
  const titleWeight = required ? '700' : '400';
  const titleColor = required ? '#6C6F76' : '#BEC1D2';

  return `
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <p style="margin: 0; font-weight: ${titleWeight}; font-size: 14px; line-height: 1.4; text-align: center; color: ${titleColor};">${title}</p>
    <p style="margin: 0; font-weight: 400; font-size: 14px; line-height: 1.4; text-align: center; color: #BEC1D2;">${body}</p>
  </div>`;
};

const meta: Meta<typeof RcSection> = {
  component: RcSection,
  argTypes:  {
    type: {
      options:     ['primary', 'secondary'] as SectionType[],
      control:     { type: 'select' },
      description: 'Visual type of the section. Primary sections have no padding/radius/background and bolder titles. Secondary sections have lateral padding, border-radius, background color, and lighter titles.',
    },
    mode: {
      options:     ['with-header', 'no-header'] as SectionMode[],
      control:     { type: 'select' },
      description: 'Controls whether the section renders with a header or without.',
    },
    title: {
      control:     { type: 'text' },
      description: 'The section title text. Can also be provided via the `title` slot.',
    },
    expandable: {
      control:     { type: 'boolean' },
      description: 'Whether the section can be expanded/collapsed via the header.',
    },
    expanded: {
      control:     { type: 'boolean' },
      description: 'Whether the section is currently expanded. Supports v-model:expanded.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcSection>;

export const Default: Story = {
  render: (args: any) => ({
    components: { RcSection },
    setup() {
      return { args };
    },
    template: `
      <RcSection v-bind="args">
        ${contentGroup('Content Group 1', 'First group content goes here.', true)}
        ${contentGroup('Content Group 2', 'Second group content goes here.')}
        ${contentGroup('Content Group 3', 'Third group content goes here.')}
      </RcSection>
    `,
  }),
  args: {
    type:       'primary',
    mode:       'with-header',
    expandable: false,
    title:      'Section title',
  },
};

export const PrimaryFixed: Story = {
  render: () => ({
    components: {
      RcSection,
      RcButton,
      RcStatusBadge,
      RcCounterBadge,
    },
    template: `
      <RcSection title="Primary section" type="primary" mode="with-header" :expandable="false">
        <template #counter>
          <RcCounterBadge :count="5" type="active" />
        </template>
        <template #badges>
          <RcStatusBadge status="success">Active</RcStatusBadge>
        </template>
        <template #actions>
          <RcButton variant="secondary" size="small">Edit</RcButton>
        </template>
        ${contentGroup('Content Group 1', 'First group content goes here.', true)}
        ${contentGroup('Content Group 2', 'Second group content goes here.')}
      </RcSection>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'shown' } },
  },
};

export const SecondaryFixed: Story = {
  render: () => ({
    components: {
      RcSection,
      RcButton,
      RcStatusBadge,
      RcCounterBadge,
    },
    template: `
      <div style="background: #EFEFEF; padding: 24px;">
        <RcSection title="Secondary section" type="secondary" mode="with-header" :expandable="false">
          <template #counter>
            <RcCounterBadge :count="3" type="active" />
          </template>
          <template #badges>
            <RcStatusBadge status="info">Pending</RcStatusBadge>
          </template>
          <template #actions>
            <RcButton variant="secondary" size="small">Configure</RcButton>
          </template>
          ${contentGroup('Content Group 1', 'First group content goes here.', true)}
          ${contentGroup('Content Group 2', 'Second group content goes here.')}
        </RcSection>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'shown' } },
  },
};

export const Expandable: Story = {
  render: () => ({
    components: {
      RcSection,
      RcButton,
      RcStatusBadge,
    },
    setup() {
      const expanded = ref(true);

      return { expanded };
    },
    template: `
      <RcSection
        title="Expandable section"
        type="primary"
        mode="with-header"
        expandable
        v-model:expanded="expanded"
      >
        <template #badges>
          <RcStatusBadge status="success">Active</RcStatusBadge>
        </template>
        <template #actions>
          <RcButton variant="secondary" size="small">Edit</RcButton>
        </template>
        ${contentGroup('Content Group 1', 'This content is visible when expanded.', true)}
        ${contentGroup('Content Group 2', 'Another content group.')}
      </RcSection>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'shown' } },
  },
};

export const CollapsedByDefault: Story = {
  render: () => ({
    components: { RcSection, RcStatusBadge },
    setup() {
      const expanded = ref(false);

      return { expanded };
    },
    template: `
      <RcSection
        title="Collapsed by default"
        type="primary"
        mode="with-header"
        expandable
        v-model:expanded="expanded"
      >
        <template #badges>
          <RcStatusBadge status="warning">Pending</RcStatusBadge>
        </template>
        ${contentGroup('Content Group 1', 'This content is hidden until expanded.', true)}
      </RcSection>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'shown' } },
  },
};

export const NoHeader: Story = {
  render: () => ({
    components: { RcSection },
    template:   `
      <RcSection type="primary" mode="no-header" :expandable="false">
        ${contentGroup('Content Group 1', 'No header, just content.', true)}
        ${contentGroup('Content Group 2', 'Second group content goes here.')}
      </RcSection>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'shown' } },
  },
};

export const WithErrorsSlot: Story = {
  render: () => ({
    components: { RcSection, RcIcon },
    template:   `
      <RcSection title="Section with errors" type="primary" mode="with-header" :expandable="false">
        <template #errors>
          <RcIcon type="error" size="small" status="error" />
        </template>
        ${contentGroup('Content Group 1', 'This section has validation errors indicated in the header.', true)}
      </RcSection>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'shown' } },
  },
};

export const AllTypes: Story = {
  render: () => ({
    components: {
      RcSection,
      RcButton,
      RcStatusBadge,
      RcCounterBadge,
    },
    setup() {
      const primaryExpanded = ref(true);
      const secondaryExpanded = ref(true);

      return { primaryExpanded, secondaryExpanded };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 32px; max-width: 900px;">
        <div>
          <h3 style="margin-bottom: 12px; color: #6C6F76;">Primary — Fixed</h3>
          <RcSection title="Primary fixed section" type="primary" mode="with-header" :expandable="false">
            <template #badges>
              <RcStatusBadge status="success">Active</RcStatusBadge>
            </template>
            ${contentGroup('Content Group 1', 'Content goes here.', true)}
          </RcSection>
        </div>

        <div>
          <h3 style="margin-bottom: 12px; color: #6C6F76;">Primary — Expandable</h3>
          <RcSection
            title="Primary expandable section"
            type="primary"
            mode="with-header"
            expandable
            v-model:expanded="primaryExpanded"
          >
            <template #counter>
              <RcCounterBadge :count="12" type="active" />
            </template>
            <template #actions>
              <RcButton variant="secondary" size="small">Edit</RcButton>
            </template>
            ${contentGroup('Content Group 1', 'Expandable content goes here.', true)}
          </RcSection>
        </div>

        <div style="background: #EFEFEF; padding: 24px; border-radius: 8px;">
          <h3 style="margin-bottom: 12px; color: #6C6F76;">Secondary — Fixed</h3>
          <RcSection title="Secondary fixed section" type="secondary" mode="with-header" :expandable="false">
            <template #badges>
              <RcStatusBadge status="info">Pending</RcStatusBadge>
            </template>
            ${contentGroup('Content Group 1', 'Content goes here.', true)}
          </RcSection>
        </div>

        <div style="background: #EFEFEF; padding: 24px; border-radius: 8px;">
          <h3 style="margin-bottom: 12px; color: #6C6F76;">Secondary — Expandable</h3>
          <RcSection
            title="Secondary expandable section"
            type="secondary"
            mode="with-header"
            expandable
            v-model:expanded="secondaryExpanded"
          >
            <template #actions>
              <RcButton variant="secondary" size="small">Configure</RcButton>
            </template>
            ${contentGroup('Content Group 1', 'Expandable content goes here.', true)}
          </RcSection>
        </div>

        <div>
          <h3 style="margin-bottom: 12px; color: #6C6F76;">No header</h3>
          <RcSection type="primary" mode="no-header" :expandable="false">
            ${contentGroup('Content Group 1', 'Content without a header.', true)}
          </RcSection>
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } },
  },
};
