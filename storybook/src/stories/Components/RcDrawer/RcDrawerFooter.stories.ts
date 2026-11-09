import type { Meta, StoryObj } from '@storybook/vue3';
import { RcDrawer, RcDrawerFooter, RcDrawerHeader } from '@components/RcDrawer';
import { RcButton } from '@components/RcButton';
import { RcButtonSplit } from '@components/RcButtonSplit';

const meta: Meta<typeof RcDrawerFooter> = {
  component:  RcDrawerFooter,
  decorators: [
    () => ({ template: '<div style="position: relative; height: 240px; border: 1px solid var(--border);"><story /></div>' }),
  ],
  argTypes: {
    secondaryLabel: { control: { type: 'text' } },
    primaryLabel:   { control: { type: 'text' } },
  },
};

export default meta;
type Story = StoryObj<typeof RcDrawerFooter>;

const body = '<p>The footer stays at the bottom of the drawer while its body scrolls.</p>';

/**
 * The footer of a drawer with an action: Close, then the primary button. Both
 * take their label from a prop, and clicking the primary one emits `primary`.
 */
export const Default: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerFooter, RcDrawerHeader
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer>
        <template #header>
          <RcDrawerHeader title="nginx-config (ConfigMap) - Configuration" />
        </template>
        ${ body }
        <template #footer>
          <RcDrawerFooter v-bind="args" />
        </template>
      </RcDrawer>
    `,
  }),
  args: { primaryLabel: 'Edit Config' },
};

/**
 * `secondaryLabel` relabels the secondary button, such as Cancel beside Save.
 * It still closes the drawer.
 */
export const CustomLabels: Story = {
  ...Default,
  args: { secondaryLabel: 'Cancel', primaryLabel: 'Save' },
};

/**
 * The `primary` slot replaces the primary button, for actions that need more
 * than a label, such as an icon, or for several of them.
 */
export const CustomButtons: Story = {
  render: () => ({
    components: {
      RcDrawer, RcDrawerFooter, RcDrawerHeader, RcButton
    },
    template: `
      <RcDrawer>
        <template #header>
          <RcDrawerHeader title="Dev Extension v0.3.674" />
        </template>
        ${ body }
        <template #footer>
          <RcDrawerFooter>
            <template #primary>
              <RcButton variant="secondary" size="large" left-icon="trash">Uninstall</RcButton>
              <RcButton variant="primary" size="large" left-icon="upgrade-alt">Upgrade</RcButton>
            </template>
          </RcDrawerFooter>
        </template>
      </RcDrawer>
    `,
  }),
};

/**
 * When a drawer has more actions than its footer has room for, such as in a
 * narrow drawer, the main one goes on an `RcButtonSplit` in the `primary` slot
 * and the rest go in its menu.
 */
export const SplitButton: Story = {
  render: () => ({
    components: {
      RcDrawer, RcDrawerFooter, RcDrawerHeader, RcButtonSplit
    },
    setup:    () => ({ items: [{ id: 'edit', label: 'Edit' }, { id: 'delete', label: 'Delete' }] }),
    template: `
      <div style="position: absolute; top: 0; right: 0; bottom: 0; width: 420px; border-left: 1px solid var(--border);">
        <RcDrawer>
          <template #header>
            <RcDrawerHeader title="HTTP - response time - is above 3 seconds" />
          </template>
          <p>Reports a deviating state when the 95th percentile response time stays above 3 seconds.</p>
          <template #footer>
            <RcDrawerFooter>
              <template #primary>
                <RcButtonSplit
                  variant="primary"
                  size="large"
                  :items="items"
                  aria-label-trigger="More monitor actions"
                >
                  Disable monitor
                </RcButtonSplit>
              </template>
            </RcDrawerFooter>
          </template>
        </RcDrawer>
      </div>
    `,
  }),
};
