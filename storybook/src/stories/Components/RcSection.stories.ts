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

const SLOT = '<!-- default slot -->';

/** Replace the slot placeholder with actual rendered content */
const withSlotContent = (template: string, slotContent: string) => template.replace(SLOT, slotContent);

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
      description: 'Background color of the section. Primary - a color that blends in with the background. Secondary - a color that contrasts the background. When omitted, nested sections automatically alternate between primary and secondary.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcSection>;

const defaultTemplate = `<RcSection v-bind="args" v-model:expanded="expanded">
  <template #counter>
    <RcCounterBadge :count="99" type="inactive" />
  </template>
  <template #errors>
    <RcIcon v-clean-tooltip="'3 validation errors'" type="error" size="large" status="error" />
  </template>
  <template #badges>
    <RcSectionBadges :badges="[
      { label: 'Status', status: 'success', tooltip: 'All systems operational' },
      { label: 'Status', status: 'warning', tooltip: 'Degraded performance' },
      { label: 'Status', status: 'error', tooltip: 'Service unavailable' },
    ]" />
  </template>
  <template #actions>
    <RcSectionActions :actions="[
      { label: 'Action', icon: 'chevron-left', action: () => {} },
      { icon: 'copy', ariaLabel: 'Copy', action: () => {} },
      { icon: 'trash', label:'Delete', action: () => {} },
    ]" />
  </template>
  ${ SLOT }
</RcSection>`;

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
    template: withSlotContent(
      defaultTemplate,
      `${ contentGroup('Content Group 1 (required)', 'Detach instance to manage the groups and their content', true) }
       ${ contentGroup('Content Group N (optional)', 'Detach instance to manage the groups and their content') }`,
    ),
  }),
  args: {
    type:       'secondary',
    mode:       'with-header',
    expandable: true,
    title:      'Section title',
    background: 'secondary',
  },
  parameters: {
    docs: {
      canvas: { sourceState: 'shown' },
      source: { code: defaultTemplate },
    },
  },
};

const primaryFixedTemplate = `<RcSection title="Primary section" type="primary" mode="with-header" :expandable="false" background="primary">
  <template #counter>
    <RcCounterBadge :count="5" type="inactive" />
  </template>
  <template #badges>
    <RcSectionBadges :badges="[{ label: 'Active', status: 'success' }]" />
  </template>
  <template #actions>
    <RcSectionActions :actions="[{ label: 'Edit', action: () => {} }]" />
  </template>
  ${ SLOT }
</RcSection>`;

export const PrimaryFixed: Story = {
  render: (args: any) => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
    },
    setup() {
      return { args };
    },
    template: withSlotContent(
      primaryFixedTemplate,
      `${ contentGroup('Content Group 1', 'First group content goes here.', true) }
       ${ contentGroup('Content Group 2', 'Second group content goes here.') }`,
    ),
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: primaryFixedTemplate },
    },
  },
};

const secondaryFixedTemplate = `<RcSection title="Secondary section" type="secondary" mode="with-header" :expandable="false" background="secondary">
  <template #counter>
    <RcCounterBadge :count="3" type="inactive" />
  </template>
  <template #badges>
    <RcSectionBadges :badges="[{ label: 'Pending', status: 'info' }]" />
  </template>
  <template #actions>
    <RcSectionActions :actions="[{ label: 'Configure', action: () => {} }]" />
  </template>
  ${ SLOT }
</RcSection>`;

export const SecondaryFixed: Story = {
  render: (args: any) => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="background: #EFEFEF; padding: 24px;">
        ${ withSlotContent(
      secondaryFixedTemplate,
      `${ contentGroup('Content Group 1', 'First group content goes here.', true) }
           ${ contentGroup('Content Group 2', 'Second group content goes here.') }`,
    ) }
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: secondaryFixedTemplate },
    },
  },
};

const expandableTemplate = `<RcSection
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
  ${ SLOT }
</RcSection>`;

export const Expandable: Story = {
  render: (args: any) => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
    },
    setup() {
      const expanded = ref(true);

      return { args, expanded };
    },
    template: withSlotContent(
      expandableTemplate,
      `${ contentGroup('Content Group 1', 'This content is visible when expanded.', true) }
       ${ contentGroup('Content Group 2', 'Another content group.') }`,
    ),
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: expandableTemplate },
    },
  },
};

const collapsedByDefaultTemplate = `<RcSection
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
  ${ SLOT }
</RcSection>`;

export const CollapsedByDefault: Story = {
  render: (args: any) => ({
    components: { RcSection, RcSectionBadges },
    setup() {
      const expanded = ref(false);

      return { args, expanded };
    },
    template: withSlotContent(
      collapsedByDefaultTemplate,
      contentGroup('Content Group 1', 'This content is hidden until expanded.', true),
    ),
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: collapsedByDefaultTemplate },
    },
  },
};

const noHeaderTemplate = `<RcSection type="primary" mode="no-header" background="primary" :expandable="false">
  ${ SLOT }
</RcSection>`;

export const NoHeader: Story = {
  render: (args: any) => ({
    components: { RcSection },
    setup() {
      return { args };
    },
    template: withSlotContent(
      noHeaderTemplate,
      `${ contentGroup('Content Group 1', 'No header, just content.', true) }
       ${ contentGroup('Content Group 2', 'Second group content goes here.') }`,
    ),
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: noHeaderTemplate },
    },
  },
};

const withErrorsSlotTemplate = `<RcSection title="Section with errors" type="primary" mode="with-header" background="primary" :expandable="false">
  <template #errors>
    <RcIcon v-clean-tooltip="'1 validation error'" type="error" size="large" status="error" />
  </template>
  ${ SLOT }
</RcSection>`;

export const WithErrorsSlot: Story = {
  render: (args: any) => ({
    components: { RcSection, RcIcon },
    setup() {
      return { args };
    },
    template: withSlotContent(
      withErrorsSlotTemplate,
      contentGroup('Content Group 1', 'This section has validation errors indicated in the header.', true),
    ),
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: withErrorsSlotTemplate },
    },
  },
};

const fullHeaderTemplate = `<RcSection
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
    <RcIcon v-clean-tooltip="'3 validation errors'" type="error" size="large" status="error" />
  </template>
  <template #badges>
    <RcSectionBadges :badges="[
      { label: 'Status', status: 'success', tooltip: 'All systems operational' },
      { label: 'Status', status: 'warning', tooltip: 'Degraded performance' },
      { label: 'Status', status: 'error', tooltip: 'Service unavailable' },
    ]" />
  </template>
  <template #actions>
    <RcSectionActions :actions="[
      { label: 'Action', icon: 'chevron-left', action: () => {} },
      { icon: 'copy', ariaLabel: 'Copy', action: () => {} },
      { icon: 'more', ariaLabel: 'More actions', action: () => {} },
    ]" />
  </template>
  ${ SLOT }
</RcSection>`;

export const FullHeader: Story = {
  render: (args: any) => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
      RcIcon,
    },
    setup() {
      const expanded = ref(true);

      return { args, expanded };
    },
    template: withSlotContent(
      fullHeaderTemplate,
      contentGroup('Content Group 1 (required)', 'Detach instance to manage the groups and their content', true),
    ),
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: fullHeaderTemplate },
    },
  },
};

/**
 * **Automatic alternating backgrounds**
 *
 * When the `background` prop is omitted, nested sections automatically
 * alternate between `primary` and `secondary` backgrounds. The outermost
 * section defaults to `primary` (no parent), its child resolves to
 * `secondary`, the grandchild back to `primary`, and so on. This creates
 * visual depth without any manual configuration.
 */
const alternatingBgTemplate = `<!-- No background prop — backgrounds alternate automatically -->
<RcSection title="Level 1" type="primary" mode="with-header" :expandable="false">
  <p>No parent — defaults to primary</p>
  <RcSection title="Level 2" type="secondary" mode="with-header" :expandable="false">
    <p>Parent is primary — auto-resolves to secondary</p>
    <RcSection title="Level 3" type="secondary" mode="with-header" :expandable="false">
      <p>Parent is secondary — auto-resolves back to primary</p>
    </RcSection>
  </RcSection>
</RcSection>`;

export const AlternatingBackgrounds: Story = {
  render: (args: any) => ({
    components: { RcSection },
    setup() {
      return { args };
    },
    template: alternatingBgTemplate,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: alternatingBgTemplate },
    },
  },
};

/**
 * **Overriding automatic backgrounds**
 *
 * You can override the automatic alternation by explicitly setting the
 * `background` prop. Here the outermost section is `primary`, and we force
 * both the child and grandchild to `primary` as well — breaking the
 * automatic alternation. This is useful when you need consecutive sections
 * to share the same visual weight regardless of nesting depth.
 */
const overrideBgTemplate = `<!-- Explicit background prop overrides the automatic alternation -->
<RcSection title="Level 1" type="secondary" mode="with-header" :expandable="false" background="secondary">
  <p>Explicit background="secondary"</p>
  <RcSection title="Level 2" type="secondary" mode="with-header" :expandable="false" background="secondary">
    <p>Would auto-resolve to primary, but forced to secondary</p>
    <RcSection title="Level 3" type="secondary" mode="with-header" :expandable="false" background="secondary">
      <p>Also forced to secondary — all three levels share the same background</p>
    </RcSection>
  </RcSection>
</RcSection>`;

export const BackgroundOverride: Story = {
  render: (args: any) => ({
    components: { RcSection },
    setup() {
      return { args };
    },
    template: overrideBgTemplate,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     {
      canvas: { sourceState: 'shown' },
      source: { code: overrideBgTemplate },
    },
  },
};

export const AllTypes: Story = {
  render: () => ({
    components: {
      RcSection,
      RcSectionBadges,
      RcSectionActions,
      RcCounterBadge,
      RcIcon,
    },
    setup(args: any) {
      const outerExpanded = ref(true);
      const middleExpanded = ref(true);
      const innerExpanded = ref(true);

      return {
        args, outerExpanded, middleExpanded, innerExpanded
      };
    },
    template: `
      <div style="max-width: 900px;">
        <RcSection
          title="Cluster overview"
          type="primary"
          mode="with-header"
          background="primary"
          expandable
          v-model:expanded="outerExpanded"
        >
          <template #counter>
            <RcCounterBadge :count="12" type="inactive" />
          </template>
          <template #errors>
            <RcIcon v-clean-tooltip="'2 validation errors'" type="error" size="large" status="error" />
          </template>
          <template #badges>
            <RcSectionBadges :badges="[
              { label: 'Active', status: 'success', tooltip: 'Cluster is healthy' },
              { label: 'Upgrading', status: 'warning', tooltip: 'Upgrade in progress' },
            ]" />
          </template>
          <template #actions>
            <RcSectionActions :actions="[
              { label: 'Edit', icon: 'edit', action: () => {} },
              { icon: 'copy', ariaLabel: 'Copy cluster ID', action: () => {} },
              { icon: 'more', ariaLabel: 'More actions', action: () => {} },
            ]" />
          </template>

          <RcSection
            title="Node pools"
            type="secondary"
            mode="with-header"
            expandable
            v-model:expanded="middleExpanded"
          >
            <template #counter>
              <RcCounterBadge :count="3" type="inactive" />
            </template>
            <template #actions>
              <RcSectionActions :actions="[
                { label: 'Add pool', action: () => {} },
              ]" />
            </template>

            <RcSection
              title="worker-pool-1"
              type="secondary"
              mode="with-header"
              expandable
              v-model:expanded="innerExpanded"
            >
              <template #actions>
                <RcSectionActions :actions="[
                  { label: 'Scale', action: () => {} },
                  { icon: 'trash', ariaLabel: 'Delete pool', action: () => {} },
                ]" />
              </template>
              ${ contentGroup('Pool details', '3 nodes running, 0 pending', true) }
            </RcSection>
          </RcSection>
        </RcSection>
      </div>
    `,
  }),
  parameters: {
    controls: { disabled: true },
    docs:     { canvas: { sourceState: 'none' } },
  },
};
