import type { Meta, StoryObj } from '@storybook/vue3';
import { ref, watch } from 'vue';
import { RcModal, type RcModalSize } from '@components/RcModal';
import { RcButton } from '@components/RcButton';
import { LabeledInput } from '@components/Form/LabeledInput';

if (!document.getElementById('modals')) {
  const target = document.createElement('div');

  target.id = 'modals';
  document.body.appendChild(target);
}

const useModalStory = (args: { show?: boolean }) => {
  const open = ref(!!args.show);

  watch(open, (value) => {
    args.show = value;
  });

  watch(() => args.show, (value) => {
    open.value = !!value;
  });

  return { args, open };
};

const meta: Meta<typeof RcModal> = {
  component: RcModal,
  argTypes:  {
    show: {
      control:     { type: 'boolean' },
      description: 'Whether the modal is open. The modal animates in and out as this changes.',
    },
    title: {
      control:     { type: 'text' },
      description: 'The modal title. Rendered as the heading and used as the modal\'s accessible name.',
    },
    size: {
      options:     ['small', 'medium', 'large'] as RcModalSize[],
      control:     { type: 'select' },
      description: 'Modal width. small = 480px (confirmations), medium = 640px (the default), large = 960px (long forms).',
    },
    clickToClose: {
      control:     { type: 'boolean' },
      description: 'When false, clicking the background or pressing Esc will not close the modal.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcModal>;

/**
 * The three regions - title, body and actions - with the spacing, padding and
 * right-aligned actions baked in, so consumers only supply content.
 */
export const Default: Story = {
  render: (args: any) => ({
    components: { RcModal, RcButton },
    setup:      () => useModalStory(args),
    template:   `
      <RcButton variant="primary" @click="open = true">Open modal</RcButton>
      <RcModal v-bind="args" :show="open" @close="open = false">
        <p>Modals used to re-implement their own header, padding, dividers and footer. RcModal supplies all of it, so every modal in dashboard lines up.</p>
        <template #primary-action="{ close }">
          <RcButton variant="primary" @click="close">Confirm</RcButton>
        </template>
      </RcModal>
    `,
  }),
  args: {
    show:         true,
    title:        'Modal title',
    size:         'medium',
    clickToClose: true,
  },
};

/**
 * `size="small"` is the width for confirmations and single-field prompts.
 */
export const Confirmation: Story = {
  render: (args: any) => ({
    components: { RcModal, RcButton },
    setup:      () => useModalStory(args),
    template:   `
      <RcButton variant="primary" @click="open = true">Delete namespace</RcButton>
      <RcModal v-bind="args" :show="open" @close="open = false">
        <p>You are attempting to delete the Namespace <b>my-namespace</b>. This cannot be undone.</p>
        <template #primary-action="{ close }">
          <RcButton variant="primary" @click="close">Delete</RcButton>
        </template>
      </RcModal>
    `,
  }),
  args: {
    show:         false,
    title:        'Are you sure?',
    size:         'small',
    clickToClose: true,
  },
};

/**
 * Each direct child of the default slot is a content section, separated by
 * 24px. Nothing in the consumer needs to set margins.
 */
export const WithSections: Story = {
  render: (args: any) => ({
    components: {
      RcModal, RcButton, LabeledInput
    },
    setup: () => ({
      ...useModalStory(args),
      project: ref(''),
    }),
    template: `
      <RcButton variant="primary" @click="open = true">Move namespace</RcButton>
      <RcModal v-bind="args" :show="open" @close="open = false">
        <p>You are moving the following namespaces:</p>
        <ul><li>my-namespace</li><li>my-other-namespace</li></ul>
        <LabeledInput v-model:value="project" label="Target project" />
        <template #actions>
          <RcButton variant="secondary" @click="open = false">Cancel</RcButton>
          <RcButton variant="primary" @click="open = false">Move</RcButton>
        </template>
      </RcModal>
    `,
  }),
  args: {
    show:         false,
    title:        'Move to a new project?',
    size:         'medium',
    clickToClose: true,
  },
};

/**
 * Content taller than the viewport scrolls, and the modal stays capped at 95%
 * of the viewport height.
 */
export const TallContent: Story = {
  render: (args: any) => ({
    components: { RcModal, RcButton },
    setup:      () => useModalStory(args),
    template:   `
      <RcButton variant="primary" @click="open = true">Open modal</RcButton>
      <RcModal v-bind="args" :show="open" @close="open = false">
        <p v-for="n in 40" :key="n">Paragraph {{ n }} of a very long modal body.</p>
        <template #actions>
          <RcButton variant="secondary" @click="open = false">Cancel</RcButton>
          <RcButton variant="primary" @click="open = false">Confirm</RcButton>
        </template>
      </RcModal>
    `,
  }),
  args: {
    show:         false,
    title:        'A very long modal',
    size:         'large',
    clickToClose: true,
  },
};

/**
 * The `title` slot replaces the heading when it needs markup. The heading is
 * still what names the dialog for assistive technology.
 */
export const RichTitle: Story = {
  render: (args: any) => ({
    components: { RcModal, RcButton },
    setup:      () => useModalStory(args),
    template:   `
      <RcButton variant="primary" @click="open = true">Open modal</RcButton>
      <RcModal v-bind="args" :show="open" @close="open = false">
        <template #title>Restore cluster from <i>snapshot-2026-08-19</i></template>
        <p>The cluster will be unavailable while the snapshot is restored.</p>
        <template #actions>
          <RcButton variant="secondary" @click="open = false">Cancel</RcButton>
          <RcButton variant="primary" @click="open = false">Restore</RcButton>
        </template>
      </RcModal>
    `,
  }),
  args: {
    show:         false,
    size:         'medium',
    clickToClose: true,
  },
};
