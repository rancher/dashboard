<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import debounce from 'lodash/debounce';
import LazyImage from '@shell/components/LazyImage.vue';
import { DropdownOption } from '@components/RcDropdown/types';
import ActionMenu from '@shell/components/ActionMenuShell.vue';

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
type ItemValue = Record<string, any>;

/**
 * Props accepted by the ItemCard component.
 */
interface Props {
  /** Unique identifier for the card (used in test IDs) */
  id: string;

  /** Any object value associated with this card */
  value: ItemValue;

  /** Card title, status icons and action menu. Image will be included in the header in small variant too */
  header: Header;

  /** Optional image to show in card (position depends on variant). A slot is available for it too #item-card-image */
  image?: Image;

  /** Optional actions that will be displayed inside an action-menu */
  actions?: DropdownOption;

  /** Text content inside the card body. A slot is available for it too #item-card-content */
  content?: Label;

  /** Layout variant: 'small' or 'medium' */
  variant?: RcItemCardVariant;

  /** Optional pill shown (only if variant is not 'small'). A slot is available for it too #item-card-pill */
  pill?: Pill;

  /** Makes the card clickable and emits 'card-click' on click/enter/space */
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  actions:   undefined,
  image:     undefined,
  content:   undefined,
  variant:   undefined,
  pill:      undefined,
  clickable: false
});

/**
 * Emits 'card-click' when card is clicked or activated via keyboard.
 */
const emit = defineEmits<{( e: 'card-click', value: ItemValue): void; }>();

/**
 * Handles the card click while avoiding nested interactive elements
 * By having .no-card-click class on an element the 'card-click' will be ignored
 */
function _handleCardClick(e: MouseEvent | KeyboardEvent) {
  // Prevent card click if the user clicks on an inner actionable element like repo, category, or tag
  if ((e.target as HTMLElement).closest('.no-card-click')) {
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

const cardEl = ref<HTMLElement | null>(null);
const dynamicWidth = ref(0);

const dynamicVariant = computed<RcItemCardVariant>(() => {
  if (props.variant) {
    return props.variant;
  }

  if (dynamicWidth.value < 500) {
    return 'small';
  }

  return 'medium';
});

const updateWidth = debounce((width: number) => {
  dynamicWidth.value = width;
}, 300);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!props.variant && cardEl.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      updateWidth(entry.contentRect.width);
    });
    resizeObserver.observe(cardEl.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver && cardEl.value) {
    resizeObserver.unobserve(cardEl.value);
  }
});

const headerTitle = computed(() => labelText(props.header.title));
const imageAlt = computed(() => labelText(props.image?.alt));
const pillLabel = computed(() => labelText(props.pill?.label));
const pillTooltip = computed(() => labelText(props.pill?.tooltip));
const contentText = computed(() => labelText(props.content));
const statusTooltips = computed(() => props.header.statuses?.map((status) => labelText(status.tooltip)) || []
);

const cardMeta = computed(() => ({
  ariaLabel: props.clickable ? t('itemCard.ariaLabel.clickable') : t('itemCard.ariaLabel.card'),
  tabIndex:  props.clickable ? '0' : undefined,
  role:      props.clickable ? 'button' : undefined
}));

</script>

<template>
  <div
    ref="cardEl"
    class="item-card"
    :role="cardMeta.role"
    :tabindex="cardMeta.tabIndex"
    :aria-label="cardMeta.ariaLabel"
    :data-testid="`item-card-${id}`"
    @click="_handleCardClick"
    @keydown.enter="_handleCardClick"
    @keydown.space.prevent="_handleCardClick"
  >
    <div :class="['item-card-body', dynamicVariant]">
      <template v-if="dynamicVariant !== 'small'">
        <div>
          <slot name="item-card-image">
            <div
              v-if="image"
              :class="['item-card-image', dynamicVariant]"
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

      <div :class="['item-card-body-details', dynamicVariant]">
        <div :class="['item-card-header', dynamicVariant]">
          <div class="item-card-header-left">
            <template v-if="dynamicVariant === 'small'">
              <slot name="item-card-image">
                <div
                  v-if="image"
                  :class="['item-card-image', dynamicVariant]"
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
                :class="['item-card-header-title', dynamicVariant]"
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
                :aria-label="statusTooltips[i] || t('itemCard.ariaLabel.status')"
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
              <div class="item-card-header-action-menu no-card-click">
                <slot name="item-card-actions" />
              </div>
            </template>
            <template v-else-if="actions">
              <div class="item-card-header-action-menu no-card-click">
                <ActionMenu
                  data-testid="item-card-header-action-menu"
                  :custom-actions="actions"
                />
              </div>
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
            :aria-label="t('itemCard.ariaLabel.content')"
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

  &:hover {
    border-color: var(--primary);
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
    }

    &-title {
      max-width: 60%;
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
      margin-left: 12px;
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
