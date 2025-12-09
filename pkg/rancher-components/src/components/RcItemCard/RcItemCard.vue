<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LazyImage from '@shell/components/LazyImage.vue';
import { DropdownOption } from '@components/RcDropdown/types';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import RcItemCardAction from './RcItemCardAction';

const store = useStore();
const { t } = useI18n(store);

/**
 * Variants available for ItemCard layout
 */
type RcItemCardVariant = 'small' | 'medium';

/**
 * A label that can be either plain text or a translatable key.
 */
type Label = {
  key?: string;
  text?: string;
};

/**
 * Represents an image used in the card.
 */
type Image = {
  src: string;
  alt?: Label;
};

/**
 * Optional pill badge, typically used to highlight a tag or state.
 */
type Pill = {
  label: Label;
  tooltip?: Label;
};

/**
 * Represents an icon-based status indicator shown in the card header.
 */
type Status = {
  icon: string;
  color?: string;
  customColor?: string;
  tooltip?: Label;
  handleClick?: () => void;
};

/**
 * Header metadata for the card.
 */
type Header = {
  title?: Label;
  statuses?: Status[];
};

/**
 * The generic data value passed to the card.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemValue = Record<string, any>;

/**
 * Props accepted by the ItemCard component.
 */
interface RcItemCardProps {
  /** Unique identifier for the card (used in test IDs) */
  id: string;

  /** Any object value associated with this card */
  value: ItemValue;

  /** Card title, status icons and action menu. Image will be included in the header in small variant too */
  header: Header;

  /** Optional image to show in card (position depends on variant). A slot is available for it too #item-card-image */
  image?: Image;

  /** Optional actions that will be displayed inside an action-menu
   *
   * Each action should include an `action` name, which is emitted as a custom event when selected.
   * To respond to the event, you must also register a matching event listener using the `@` syntax.
   *
   * Example:
   * <rc-item-card
   *   :actions="[
   *     {
   *       action: 'focusSearch',
   *       label: t('catalog.charts.search'),
   *       enabled: true
   *     }
   *   ]"
   *   @focusSearch="focusSearch"
   * />
   */
  actions?: DropdownOption[];

  /** Text content inside the card body. A slot is available for it too #item-card-content */
  content?: Label;

  /** Layout variant: 'small' or 'medium' */
  variant?: RcItemCardVariant;

  /** Optional pill shown (only if variant is not 'small'). A slot is available for it too #item-card-pill */
  pill?: Pill;

  /** Makes the card clickable and emits 'card-click' on click/enter/space */
  clickable?: boolean;
}

const props = defineProps<RcItemCardProps>();

/**
 * Emits:
 * - 'card-click' when card is clicked or activated via keyboard.
 * - custom events defined in the `actions` prop, but only if the corresponding event listener is explicitly declared on the component.
 */
const emit = defineEmits<{(e: 'card-click', value: ItemValue): void; (e: string, payload: unknown): void;}>();

const actionListeners = computed(() => {
  if (!props.actions) return {};

  const listeners: Record<string, (payload: unknown) => void> = {};

  for (const a of props.actions) {
    if (a.action) {
      listeners[a.action] = (payload: unknown) => emit(a.action, payload);
    }
  }

  return listeners;
});

/**
 * Handles the card click while avoiding nested interactive elements
 * By using RcItemCardAction.vue the 'item-card-action' attribute automatically gets added
 * which then gets used to ignore 'card-click'
 */
function _handleCardClick(e: MouseEvent | KeyboardEvent) {
  const interactiveSelector = '[item-card-action]';

  // Prevent card click if the user clicks on an inner actionable element like repo, category, or tag
  if ((e.target as HTMLElement).closest(interactiveSelector)) {
    return;
  }

  emit('card-click', props.value);
}

/**
 * Utility to resolve localized or plain text labels.
 */
function labelText(label?: Label): string {
  return label?.key ? t(label.key) : label?.text ?? '';
}

/** ---------------- data ------------------ */
const cardEl = ref<HTMLElement | null>(null);

/** ---------------- Computed ------------------ */

const headerTitle = computed(() => labelText(props.header.title));
const imageAlt = computed(() => labelText(props.image?.alt));
const pillLabel = computed(() => labelText(props.pill?.label));
const pillTooltip = computed(() => labelText(props.pill?.tooltip));
const contentText = computed(() => labelText(props.content));
const statusTooltips = computed(() => props.header.statuses?.map((status) => labelText(status.tooltip)) || []);

const cardMeta = computed(() => ({
  ariaLabel: props.clickable ? t('itemCard.ariaLabel.clickable', { cardTitle: labelText(props.header.title) }) : undefined,
  tabIndex:  props.clickable ? '0' : undefined,
  role:      props.clickable ? 'button' : undefined
}));

</script>

<template>
  <div
    ref="cardEl"
    class="item-card"
    :class="{
      'clickable':
        clickable
    }"
    :role="cardMeta.role"
    :tabindex="cardMeta.tabIndex"
    :aria-label="cardMeta.ariaLabel"
    :data-testid="`item-card-${id}`"
    @click="_handleCardClick"
    @keydown.enter="_handleCardClick"
    @keydown.space.prevent="_handleCardClick"
  >
    <div :class="['item-card-body', variant]">
      <template v-if="variant !== 'small'">
        <div>
          <slot name="item-card-image">
            <div
              v-if="image"
              :class="['item-card-image', variant]"
              data-testid="item-card-image"
            >
              <LazyImage
                :src="image.src"
                :alt="imageAlt"
                :style="{'width': '40px', 'height': '40px', 'object-fit': 'contain'}"
              />
            </div>
          </slot>
          <slot name="item-card-pill">
            <div
              v-if="pill"
              v-clean-tooltip="pillTooltip"
              class="item-card-pill"
              data-testid="item-card-pill"
            >
              {{ pillLabel }}
            </div>
          </slot>
        </div>
      </template>

      <div :class="['item-card-body-details', variant]">
        <div :class="['item-card-header', variant]">
          <div class="item-card-header-left">
            <template v-if="variant === 'small'">
              <slot name="item-card-image">
                <div
                  v-if="image"
                  :class="['item-card-image', variant]"
                  data-testid="item-card-image"
                >
                  <LazyImage
                    :src="image.src"
                    :alt="imageAlt"
                    :style="{'width': '24px', 'height': '24px', 'object-fit': 'contain'}"
                  />
                </div>
              </slot>
            </template>
            <slot name="item-card-header-title">
              <h3
                v-if="header.title"
                v-clean-tooltip="headerTitle"
                :class="['item-card-header-title', variant]"
                data-testid="item-card-header-title"
              >
                {{ headerTitle }}
              </h3>
            </slot>
          </div>
          <div class="item-card-header-right">
            <div
              v-if="header.statuses?.length"
              class="item-card-header-statuses"
            >
              <div
                v-for="(status, i) in header.statuses"
                :key="i"
                class="item-card-header-statuses-status"
                data-testid="item-card-header-statuses-status"
              >
                <i
                  v-clean-tooltip="statusTooltips[i]"
                  :class="['icon', status.icon, status.color]"
                  :style="{color: status.customColor}"
                  :data-testid="`item-card-header-status-${i}`"
                />
              </div>
            </div>

            <template v-if="$slots['item-card-actions']">
              <div class="item-card-header-action-menu">
                <slot name="item-card-actions" />
              </div>
            </template>
            <template v-else-if="actions">
              <rc-item-card-action class="item-card-header-action-menu">
                <ActionMenu
                  data-testid="item-card-header-action-menu"
                  :custom-actions="actions"
                  v-on="actionListeners"
                />
              </rc-item-card-action>
            </template>
          </div>
        </div>

        <slot name="item-card-sub-header" />

        <template v-if="$slots['item-card-content']">
          <slot name="item-card-content">
            <div
              class="item-card-content"
              data-testid="item-card-content"
            />
          </slot>
        </template>
        <template v-else-if="content">
          <div
            class="item-card-content"
            data-testid="item-card-content"
          >
            <p>{{ contentText }}</p>
          </div>
        </template>

        <slot name="item-card-footer" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$image-medium-box-width: 48px;

.item-card {
  display: flex;
  padding: 16px;
  align-items: flex-start;
  gap: var(--gap-lg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border);
  background: var(--body-bg);

  &.clickable:hover {
    border-color: var(--primary);
  }

  &:focus-visible {
    @include focus-outline;
    outline-offset: -2px;
  }

  &-image {
    width: $image-medium-box-width;
    height: $image-medium-box-width;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: var(--border-radius);

    &.small {
      width: 32px;
      height: 32px;
      margin-right: 12px;
    }
  }

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 24px;
    color: var(--body-text);

    &-left,
    &-right {
      display: flex;
      align-items: center;
    }

    &-left {
      flex-grow: 1;
      min-width: 0;
    }

    &-title {
      max-width: 80%;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 0px;
      line-height: 24px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    &-statuses {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      &-status {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;

        .icon {
          font-size: 23px;

          &.error    { color: var(--error); }
          &.info     { color: var(--info); }
          &.success  { color: var(--success); }
        }
      }
    }

    &-action-menu {
      margin-left: 8px;
      margin-right: -8px;
    }
  }

  &-content {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 21px;
    word-break: break-word;
  }

  &-pill {
    display: flex;
    width: $image-medium-box-width;
    padding: 4px 8px;
    margin-top: 16px;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius);
    background: var(--default);
    text-transform: uppercase;
    color: var(--disabled-text);
    font-size: 10px;
    font-weight: 600;
  }

  &-body {
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: var(--gap-lg);

    &.small {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--gap);
      flex: 1;
    }

    &-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: calc(100% - var(--gap-lg) - $image-medium-box-width);
      gap: var(--gap);
      flex: 1;

      &.small {
        width: 100%;
      }
    }
  }
}

</style>
