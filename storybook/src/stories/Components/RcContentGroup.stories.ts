import type { Meta, StoryObj } from '@storybook/vue3';
import { RcContentGroup, RcContentGroups } from '@components/Layout';
import { RcSection } from '@components/RcSection';
import { LabeledInput } from '@components/Form/LabeledInput';

const meta: Meta<typeof RcContentGroup> = {
  component:  RcContentGroup,
  parameters: {
    docs: {
      description: {
        component: `A group of related content, stacked 16px apart, and its plural counterpart RcContentGroups, a stack of such groups spaced 24px apart.

RcSection wraps its default slot in an RcContentGroups, so a section's direct children are already its groups. Reach for RcContentGroup when a run of that content belongs together at the tighter 16px.

Neither component is tied to RcSection, so either can be used on its own wherever a 16px or 24px column is wanted. They take no props and hide themselves when they have no content, so a group whose content is entirely conditioned out takes no space in whatever is stacking it.`,
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

const groupsTemplate = `<RcContentGroups>
  <RcContentGroup>
    <LabeledInput label="Name" placeholder="my-workload" />
    <LabeledInput label="Description" placeholder="What this is for" />
  </RcContentGroup>
  <RcContentGroup>
    <LabeledInput label="Namespace" placeholder="default" />
  </RcContentGroup>
</RcContentGroups>`;

export const SeveralGroups: Story = {
  render: () => ({
    components: {
      RcContentGroups, RcContentGroup, LabeledInput
    },
    template: groupsTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'The pair together. RcContentGroups spaces the groups 24px apart, each group stacks its own content 16px apart.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: groupsTemplate },
    },
  },
};

const inSectionTemplate = `<RcSection title="Section title" type="primary" mode="with-header" background="primary" :expandable="false">
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
    template: inSectionTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'The same pair inside a section. The section already wraps its default slot in an RcContentGroups, so the groups go straight in it.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: inSectionTemplate },
    },
  },
};

const emptyTemplate = `<div style="display: flex; flex-direction: column; gap: 16px;">
  <p style="margin: 0;">Content above the group</p>
  <RcContentGroup>
    <p v-if="false" style="margin: 0;">Conditioned out, so the group is empty</p>
  </RcContentGroup>
  <p style="margin: 0;">Content below the group (no 16px gap is spent on the empty group)</p>
</div>`;

export const Empty: Story = {
  render: () => ({
    components: { RcContentGroup },
    template:   emptyTemplate,
  }),
  parameters: {
    docs: {
      description: { story: 'A group whose content is entirely conditioned out hides itself, so it takes no space in the gap of whatever is stacking it.' },
      canvas:      { sourceState: 'shown' },
      source:      { code: emptyTemplate },
    },
  },
};
