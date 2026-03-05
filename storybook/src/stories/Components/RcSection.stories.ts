import type { Meta, StoryObj } from '@storybook/vue3';
import { RcSection, RcSectionBadges, RcSectionActions } from '@components/RcSection';
import { SectionType, SectionMode, SectionBackground } from '@components/RcSection/types';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import { RcIcon } from '@components/RcIcon';
import { ref, watch, toRef } from 'vue';

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
    <p style="margin: 0; font-weight: ${ titleWeight }; font-size: 14px; line-height: 1.4; text-align: center; color: ${ titleColor };">${ title }</p>
    <p style="margin: 0; font-weight: 400; font-size: 14px; line-height: 1.4; text-align: center; color: #BEC1D2;">${ body }</p>
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
    background: {
      options:     ['primary', 'secondary'] as SectionBackground[],
      control:     { type: 'select' },
      description: 'Background color of the section. Primary - a color that blends in with the background. Secondary - a color that contrasts the background.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcSection>;

export const Default: Story = {
  render: (args: any) => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
      RcIcon,
    },
    setup() {
      const expanded = ref(args.expanded ?? true);

      watch(toRef(args, 'expanded'), (val) => {
        if (val !== undefined) {
          expanded.value = val;
        }
      });

      return { args, expanded };
    },
    template: `
      <RcSection v-bind="args" v-model:expanded="expanded">
        <template #counter>
          <RcCounterBadge :count="99" type="inactive" />
        </template>
        <template #errors>
          <RcIcon type="error" size="large" status="error" />
        </template>
        <template #badges>
          <RcSectionBadges :badges="[
            { label: 'Status', status: 'success' },
            { label: 'Status', status: 'warning' },
            { label: 'Status', status: 'error' },
          ]" />
        </template>
        <template #actions>
          <RcSectionActions :actions="[
            { label: 'Action', icon: 'chevron-left', action: () => {} },
            { icon: 'copy', action: () => {} },
            { icon: 'trash', label:'Delete', action: () => {} },
          ]" />
        </template>
        ${ contentGroup('Content Group 1 (required)', 'Detach instance to manage the groups and their content', true) }
        ${ contentGroup('Content Group N (optional)', 'Detach instance to manage the groups and their content') }
      </RcSection>
    `,
  }),
  args: {
    type:       'secondary',
    mode:       'with-header',
    expandable: true,
    title:      'Section title',
    background: 'secondary',
  },
};

export const PrimaryFixed: Story = {
  render: () => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
    },
    template: `
      <RcSection title="Primary section" type="primary" mode="with-header" :expandable="false" background="primary">
        <template #counter>
          <RcCounterBadge :count="5" type="inactive" />
        </template>
        <template #badges>
          <RcSectionBadges :badges="[{ label: 'Active', status: 'success' }]" />
        </template>
        <template #actions>
          <RcSectionActions :actions="[{ label: 'Edit', action: () => {} }]" />
        </template>
        ${ contentGroup('Content Group 1', 'First group content goes here.', true) }
        ${ contentGroup('Content Group 2', 'Second group content goes here.') }
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
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
    },
    template: `
      <div style="background: #EFEFEF; padding: 24px;">
        <RcSection title="Secondary section" type="secondary" mode="with-header" :expandable="false" background="secondary">
          <template #counter>
            <RcCounterBadge :count="3" type="inactive" />
          </template>
          <template #badges>
            <RcSectionBadges :badges="[{ label: 'Pending', status: 'info' }]" />
          </template>
          <template #actions>
            <RcSectionActions :actions="[{ label: 'Configure', action: () => {} }]" />
          </template>
          ${ contentGroup('Content Group 1', 'First group content goes here.', true) }
          ${ contentGroup('Content Group 2', 'Second group content goes here.') }
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
      RcSectionBadges,
      RcSectionActions,
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
        background="primary"
        expandable
        v-model:expanded="expanded"
      >
        <template #badges>
          <RcSectionBadges :badges="[{ label: 'Active', status: 'success' }]" />
        </template>
        <template #actions>
          <RcSectionActions :actions="[{ label: 'Edit', action: () => {} }]" />
        </template>
        ${ contentGroup('Content Group 1', 'This content is visible when expanded.', true) }
        ${ contentGroup('Content Group 2', 'Another content group.') }
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
    components: { RcSection, RcSectionBadges },
    setup() {
      const expanded = ref(false);

      return { expanded };
    },
    template: `
      <RcSection
        title="Collapsed by default"
        type="primary"
        mode="with-header"
        background="primary"
        expandable
        v-model:expanded="expanded"
      >
        <template #badges>
          <RcSectionBadges :badges="[{ label: 'Pending', status: 'warning' }]" />
        </template>
        ${ contentGroup('Content Group 1', 'This content is hidden until expanded.', true) }
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
      <RcSection type="primary" mode="no-header" background="primary" :expandable="false">
        ${ contentGroup('Content Group 1', 'No header, just content.', true) }
        ${ contentGroup('Content Group 2', 'Second group content goes here.') }
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
      <RcSection title="Section with errors" type="primary" mode="with-header" background="primary" :expandable="false">
        <template #errors>
          <RcIcon type="error" size="large" status="error" />
        </template>
        ${ contentGroup('Content Group 1', 'This section has validation errors indicated in the header.', true) }
      </RcSection>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'shown' } },
  },
};

export const FullHeader: Story = {
  render: () => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
      RcIcon,
    },
    setup() {
      const expanded = ref(true);

      return { expanded };
    },
    template: `
      <RcSection
        title="Section title"
        type="primary"
        mode="with-header"
        background="primary"
        expandable
        v-model:expanded="expanded"
      >
        <template #counter>
          <RcCounterBadge :count="99" type="inactive" />
        </template>
        <template #errors>
          <RcIcon type="error" size="large" status="error" />
        </template>
        <template #badges>
          <RcSectionBadges :badges="[
            { label: 'Status', status: 'success' },
            { label: 'Status', status: 'warning' },
            { label: 'Status', status: 'error' },
          ]" />
        </template>
        <template #actions>
          <RcSectionActions :actions="[
            { label: 'Action', icon: 'chevron-left', action: () => {} },
            { icon: 'copy', action: () => {} },
            { icon: 'more', action: () => {} },
          ]" />
        </template>
        ${ contentGroup('Content Group 1 (required)', 'Detach instance to manage the groups and their content', true) }
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
      RcSectionBadges,
      RcSectionActions,
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
          <RcSection title="Primary fixed section" type="primary" mode="with-header" background="primary" :expandable="false">
            <template #badges>
              <RcSectionBadges :badges="[{ label: 'Active', status: 'success' }]" />
            </template>
            ${ contentGroup('Content Group 1', 'Content goes here.', true) }
          </RcSection>
        </div>

        <div>
          <h3 style="margin-bottom: 12px; color: #6C6F76;">Primary — Expandable</h3>
          <RcSection
            title="Primary expandable section"
            type="primary"
            mode="with-header"
            background="primary"
            expandable
            v-model:expanded="primaryExpanded"
          >
            <template #counter>
              <RcCounterBadge :count="12" type="inactive" />
            </template>
            <template #actions>
              <RcSectionActions :actions="[{ label: 'Edit', action: () => {} }]" />
            </template>
            ${ contentGroup('Content Group 1', 'Expandable content goes here.', true) }
          </RcSection>
        </div>

        <div style="background: #EFEFEF; padding: 24px; border-radius: 8px;">
          <h3 style="margin-bottom: 12px; color: #6C6F76;">Secondary — Fixed</h3>
          <RcSection title="Secondary fixed section" type="secondary" mode="with-header" background="secondary" :expandable="false">
            <template #badges>
              <RcSectionBadges :badges="[{ label: 'Pending', status: 'info' }]" />
            </template>
            ${ contentGroup('Content Group 1', 'Content goes here.', true) }
          </RcSection>
        </div>

        <div style="background: #EFEFEF; padding: 24px; border-radius: 8px;">
          <h3 style="margin-bottom: 12px; color: #6C6F76;">Secondary — Expandable</h3>
          <RcSection
            title="Secondary expandable section"
            type="secondary"
            mode="with-header"
            background="secondary"
            expandable
            v-model:expanded="secondaryExpanded"
          >
            <template #actions>
              <RcSectionActions :actions="[{ label: 'Configure', action: () => {} }]" />
            </template>
            ${ contentGroup('Content Group 1', 'Expandable content goes here.', true) }
          </RcSection>
        </div>

        <div>
          <h3 style="margin-bottom: 12px; color: #6C6F76;">No header</h3>
          <RcSection type="primary" mode="no-header" background="primary" :expandable="false">
            ${ contentGroup('Content Group 1', 'Content without a header.', true) }
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
