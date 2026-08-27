import type { Meta, StoryObj } from '@storybook/vue3';
import { RcContentGroup } from '@components/Layout';
import { RcSection } from '@components/RcSection';
import { LabeledInput } from '@components/Form/LabeledInput';

const meta: Meta<typeof RcContentGroup> = {
  component:  RcContentGroup,
  parameters: {
    docs: {
      description: {
        component: `A group of related content, stacked 16px apart.

RcSection wraps its default slot in one of these, so form elements written straight into a section are already grouped and no call site needs a wrapper div of its own. A section that needs several groups replaces that wrapper through the section's \`groups\` slot, and the section spaces the groups it is given 24px apart.

The component is not tied to RcSection, so it can also be used on its own wherever a 16px column is wanted. It takes no props.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcContentGroup>;

const defaultTemplate = `<RcContentGroup>
  <LabeledInput label="Name" placeholder="my-workload" />
  <LabeledInput label="Description" placeholder="What this is for" />
</RcContentGroup>`;

export const Default: Story = {
  render: () => ({
    components: { RcContentGroup, LabeledInput },
    template:   defaultTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'A group on its own. Its content is stacked 16px apart.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: defaultTemplate },
    },
  },
};

const inSectionTemplate = `<RcSection title="Section title" type="primary" mode="with-header" background="primary" :expandable="false">
  <LabeledInput label="Name" placeholder="my-workload" />
  <LabeledInput label="Description" placeholder="What this is for" />
</RcSection>`;

export const TheSectionDefault: Story = {
  render: () => ({
    components: { RcSection, LabeledInput },
    template:   inSectionTemplate,
  }),
  parameters: {
    docs: {
      description: { story: "A section's default slot is already one of these groups, so the same 16px spacing needs nothing written at the call site." },
      canvas:      { sourceState: 'shown' },
      source:      { code: inSectionTemplate },
    },
  },
};

const severalGroupsTemplate = `<RcSection title="Section title" type="primary" mode="with-header" background="primary" :expandable="false">
  <template #groups>
    <RcContentGroup>
      <LabeledInput label="Name" placeholder="my-workload" />
      <LabeledInput label="Description" placeholder="What this is for" />
    </RcContentGroup>
    <RcContentGroup>
      <LabeledInput label="Namespace" placeholder="default" />
    </RcContentGroup>
  </template>
</RcSection>`;

export const SeveralGroupsInASection: Story = {
  render: () => ({
    components: {
      RcSection, RcContentGroup, LabeledInput
    },
    template: severalGroupsTemplate,
  }),
  parameters: {
    docs: {
      description: { story: "The `groups` slot replaces the section's default group. The section spaces the groups it is given 24px apart, and each group stacks its own content 16px apart." },
      canvas:      { sourceState: 'shown' },
      source:      { code: severalGroupsTemplate },
    },
  },
};
