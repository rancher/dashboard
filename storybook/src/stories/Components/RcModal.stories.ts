import type { Meta, StoryObj } from '@storybook/vue3';
import { useArgs } from '@storybook/preview-api';
import { ref } from 'vue';
import { RcModal, useModal, type RcModalSize } from '@components/RcModal';
import { RcButton } from '@components/RcButton';
import { LabeledInput } from '@components/Form/LabeledInput';

if (!document.getElementById('modals')) {
  const target = document.createElement('div');

  target.id = 'modals';
  document.body.appendChild(target);
}

type UpdateArgs = (args: { show: boolean }) => void;

const showHandlers = (updateArgs: UpdateArgs) => ({
  openModal:  () => updateArgs({ show: true }),
  closeModal: () => updateArgs({ show: false }),
});

const meta: Meta<typeof RcModal> = {
  component: RcModal,
  argTypes:  {
    show: {
      control:     { type: 'boolean' },
      description: 'Whether the modal is open. The modal never changes this itself: it emits close and the consumer sets it.',
    },
    title: {
      control:     { type: 'text' },
      description: 'The modal title. Rendered as the heading and used as the modal\'s accessible name.',
    },
    size: {
      options:     ['small', 'medium', 'large'] as RcModalSize[],
      control:     { type: 'select' },
      description: 'Modal width, padding included. small = 480px (confirmations), medium = 640px (the default), large = 960px (long forms).',
    },
    clickToClose: {
      control:     { type: 'boolean' },
      description: 'When false, clicking the background or pressing Esc does not emit close.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RcModal>;

/**
 * The three regions - title, body and actions - with the spacing, padding and
 * right-aligned actions baked in, so consumers only supply content.
 *
 * Every story here drives `show` and nothing else: the button sets it true and
 * the `close` event sets it false.
 */
export const Default: Story = {
  render: (args: any) => {
    const [, updateArgs] = useArgs();

    return {
      components: { RcModal, RcButton },
      setup:      () => ({ args, ...showHandlers(updateArgs) }),
      template:   `
        <RcButton variant="primary" @click="openModal">Open modal</RcButton>
        <RcModal v-bind="args" @close="closeModal" @primary-action="closeModal">
          <p>Modals used to re-implement their own header, padding, dividers and footer. RcModal supplies all of it, so every modal in dashboard lines up.</p>
          <template #primary-action="{ primaryAction }">
            <RcButton variant="primary" size="large" @click="primaryAction">Confirm</RcButton>
          </template>
        </RcModal>
      `,
    };
  },
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
  render: (args: any) => {
    const [, updateArgs] = useArgs();

    return {
      components: { RcModal, RcButton },
      setup:      () => ({ args, ...showHandlers(updateArgs) }),
      template:   `
        <RcButton variant="primary" @click="openModal">Delete namespace</RcButton>
        <RcModal v-bind="args" @close="closeModal" @primary-action="closeModal">
          <p>You are attempting to delete the Namespace <b>my-namespace</b>. This cannot be undone.</p>
          <template #primary-action="{ primaryAction }">
            <RcButton variant="primary" size="large" @click="primaryAction">Delete</RcButton>
          </template>
        </RcModal>
      `,
    };
  },
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
  render: (args: any) => {
    const [, updateArgs] = useArgs();

    return {
      components: {
        RcModal, RcButton, LabeledInput
      },
      setup: () => ({
        args,
        ...showHandlers(updateArgs),
        project: ref(''),
      }),
      template: `
        <RcButton variant="primary" @click="openModal">Move namespace</RcButton>
        <RcModal v-bind="args" @close="closeModal" @primary-action="closeModal">
          <p>You are moving the following namespaces:</p>
          <ul><li>my-namespace</li><li>my-other-namespace</li></ul>
          <LabeledInput v-model:value="project" label="Target project" />
          <template #actions="{ cancel, primaryAction }">
            <RcButton variant="tertiary" size="large" @click="cancel">Cancel</RcButton>
            <RcButton variant="primary" size="large" @click="primaryAction">Move</RcButton>
          </template>
        </RcModal>
      `,
    };
  },
  args: {
    show:         false,
    title:        'Move to a new project?',
    size:         'medium',
    clickToClose: true,
  },
};

/**
 * Content taller than the viewport scrolls, and the modal stays within the
 * viewport, less the 40px of breathing room around it.
 */
export const TallContent: Story = {
  render: (args: any) => {
    const [, updateArgs] = useArgs();

    return {
      components: { RcModal, RcButton },
      setup:      () => ({ args, ...showHandlers(updateArgs) }),
      template:   `
        <RcButton variant="primary" @click="openModal">Open modal</RcButton>
        <RcModal v-bind="args" @close="closeModal" @primary-action="closeModal">
          <p v-for="n in 40" :key="n">Paragraph {{ n }} of a very long modal body.</p>
          <template #actions="{ cancel, primaryAction }">
            <RcButton variant="tertiary" size="large" @click="cancel">Cancel</RcButton>
            <RcButton variant="primary" size="large" @click="primaryAction">Confirm</RcButton>
          </template>
        </RcModal>
      `,
    };
  },
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
  render: (args: any) => {
    const [, updateArgs] = useArgs();

    return {
      components: { RcModal, RcButton },
      setup:      () => ({ args, ...showHandlers(updateArgs) }),
      template:   `
        <RcButton variant="primary" @click="openModal">Open modal</RcButton>
        <RcModal v-bind="args" @close="closeModal" @primary-action="closeModal">
          <template #title>Restore cluster from <i>snapshot-2026-08-19</i></template>
          <p>The cluster will be unavailable while the snapshot is restored.</p>
          <template #actions="{ cancel, primaryAction }">
            <RcButton variant="tertiary" size="large" @click="cancel">Cancel</RcButton>
            <RcButton variant="primary" size="large" @click="primaryAction">Restore</RcButton>
          </template>
        </RcModal>
      `,
    };
  },
  args: {
    show:         false,
    size:         'medium',
    clickToClose: true,
  },
};

/**
 * How product code should wire a modal. `useModal` owns the `show` ref and the
 * `close` handler, so `v-bind="modal"` is the whole wiring and the consumer
 * writes neither. Opening with a value carries it into the body, which is what
 * a modal opened from a list row needs.
 *
 * The other stories drive the `show` arg instead, so the Controls panel stays
 * honest; this one is wired the way a real consumer would be.
 */
export const WiredWithComposable: Story = {
  render: () => ({
    components: { RcModal, RcButton },
    setup:      () => useModal<string>(),
    template:   `
      <div style="display: flex; gap: 12px;">
        <RcButton variant="primary" @click="open('my-namespace')">Delete my-namespace</RcButton>
        <RcButton variant="primary" @click="open('my-other-namespace')">Delete my-other-namespace</RcButton>
      </div>
      <RcModal v-bind="modal" title="Are you sure?" size="small" @primary-action="close">
        <p>You are attempting to delete the Namespace <b>{{ payload }}</b>. This cannot be undone.</p>
        <template #primary-action="{ primaryAction }">
          <RcButton variant="primary" size="large" @click="primaryAction">Delete</RcButton>
        </template>
      </RcModal>
    `,
  }),
  parameters: { controls: { disable: true } },
};
