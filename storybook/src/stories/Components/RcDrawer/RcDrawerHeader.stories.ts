import type { Meta, StoryObj } from '@storybook/vue3';
import { RcDrawer, RcDrawerHeader } from '@components/RcDrawer';
import StateDot from '@shell/components/StateDot/index.vue';

const meta: Meta<typeof RcDrawerHeader> = {
  component:  RcDrawerHeader,
  decorators: [
    () => ({ template: '<div style="position: relative; height: 200px; border: 1px solid var(--border);"><story /></div>' }),
  ],
  args: { title: 'nginx-config (ConfigMap) - Configuration' },
};

export default meta;
type Story = StoryObj<typeof RcDrawerHeader>;

const body = '<p>The header stays at the top of the drawer while its body scrolls.</p>';

/**
 * The header every drawer has: the `title`, which also names the drawer, and
 * the close button.
 */
export const Default: Story = {
  render: (args: any) => ({
    components: { RcDrawer, RcDrawerHeader },
    setup:      () => ({ args }),
    template:   `
      <RcDrawer>
        <template #header>
          <RcDrawerHeader v-bind="args" />
        </template>
        ${ body }
      </RcDrawer>
    `,
  }),
};

/**
 * What goes in the default slot replaces the title the header shows, such as
 * the state dot Show Configuration puts before the resource name. The `title`
 * still names the drawer, so keep it to the plain text of what the header
 * shows.
 */
export const RichTitle: Story = {
  render: (args: any) => ({
    components: {
      RcDrawer, RcDrawerHeader, StateDot
    },
    setup:    () => ({ args }),
    template: `
      <RcDrawer>
        <template #header>
          <RcDrawerHeader v-bind="args">
            <StateDot color="success" class="mmr-3" />
            {{ args.title }}
          </RcDrawerHeader>
        </template>
        ${ body }
      </RcDrawer>
    `,
  }),
};

/**
 * Buttons that act on the drawer's content, such as Dock to shell, go in
 * `actions` beside the X, as icon buttons sized like it with an `aria-label`
 * and a tooltip.
 */
export const Actions: Story = {
  render: (args: any) => ({
    components: { RcDrawer, RcDrawerHeader },
    setup:      () => ({ args }),
    template:   `
      <RcDrawer>
        <template #header>
          <RcDrawerHeader v-bind="args">
            <template #actions>
              <button
                type="button"
                class="btn role-link"
                aria-label="Dock to shell"
                title="Dock to shell"
                style="display: inline-flex; justify-content: center; width: 24px; height: 24px; color: var(--body-text);"
              >
                <i class="icon icon-dock" />
              </button>
            </template>
          </RcDrawerHeader>
        </template>
        ${ body }
      </RcDrawer>
    `,
  }),
  args: { title: 'Chart Info' },
};
