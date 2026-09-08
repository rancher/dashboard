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

RcSection already stacks its default slot 16px apart, so form elements written straight into a section need no wrapper of their own. A section that needs several groups writes one of these per group instead, and the section spaces those groups 24px apart.

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
      description: { story: "A section's default slot already stacks its content 16px apart, so the same spacing needs nothing written at the call site." },
      canvas:      { sourceState: 'shown' },
      source:      { code: inSectionTemplate },
    },
  },
};

const severalGroupsTemplate = `<RcSection title="Section title" type="primary" mode="with-header" background="primary" :expandable="false">
  <RcContentGroup>
    <LabeledInput label="Name" placeholder="my-workload" />
    <LabeledInput label="Description" placeholder="What this is for" />
  </RcContentGroup>
  <RcContentGroup>
    <LabeledInput label="Namespace" placeholder="default" />
  </RcContentGroup>
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
      description: { story: 'The section spaces the groups 24px apart, and each group stacks its own content 16px apart.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: severalGroupsTemplate },
    },
  },
};
