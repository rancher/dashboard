<script setup lang="ts">
import { PropType, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LazyImage from '@shell/components/LazyImage';

type ItemCardVariant = 'small' | 'medium';

type Label = {
  key?: string;
  text?: string;
}

type Image = {
  src: string;
  alt?: Label;
};

type Pill = {
  label: Label;
  tooltip?: Label;
};

type Status = {
  icon: string;
  color?: string;
  customColor?: string;
  tooltip?: Label;
  handleClick?: () => void;
}

type Header = {
  title?: Label;
  statuses?: Status[];
}

type ItemValue = Record<string, any>;

const store = useStore();
const { t } = useI18n(store);

const emit = defineEmits<{( e: 'card-click', value: ItemValue): void; }>();

const props = defineProps({
  id: {
    type:     String,
    required: true
  },
  value: {
    type:     Object as PropType<ItemValue>,
    required: true
  },
  header: {
    type:     Object as PropType<Header>,
    required: true
  },
  image: {
    type:    Object as PropType<Image> | undefined,
    default: undefined
  },
  content: {
    type:    Object as PropType<Label> | undefined,
    default: undefined
  },
  variant: {
    type:    String as PropType<ItemCardVariant>,
    default: 'medium'
  },
  pill: { // can be visible only when the card's variant is NOT small
    type:    Object as PropType<Pill> | undefined,
    default: undefined
  },
  clickable: {
    type:    Boolean,
    default: false
  }
});

function _handleCardClick(e: MouseEvent | KeyboardEvent) {
  // Prevent card click if the user clicks on an inner actionable element like repo, category, or tag
  if ((e.target as HTMLElement).closest('.no-card-click')) {
    return;
  }

  emit('card-click', props.value);
}

function labelText(label?: Label): string {
  return label?.key ? t(label.key) : label?.text ?? '';
}

const visibleStatuses = computed(() => props.header.statuses?.slice(0, 3) || []);

</script>

<template>
  <div
    class="item-card"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? '0' : undefined"
    :aria-label="labelText(header?.title) || 'Item Card'"
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
                :alt="labelText(image?.alt)"
              />
            </div>
          </slot>
          <slot name="item-card-pill">
            <div
              v-if="pill && variant !== 'small'"
              v-clean-tooltip="labelText(pill.tooltip)"
              class="item-card-pill"
              :aria-label="labelText(pill.tooltip) || labelText(pill.label)"
              data-testid="item-card-pill"
            >
              {{ labelText(pill.label) }}
            </div>
          </slot>
        </div>
      </template>

      <div class="item-card-body-details">
        <div :class="['item-card-header', variant]">
          <template v-if="variant === 'small'">
            <slot name="item-card-image">
              <div
                v-if="image"
                :class="['item-card-image', variant]"
                data-testid="item-card-image"
              >
                <LazyImage
                  :src="image.src"
                  :alt="labelText(image?.alt)"
                />
              </div>
            </slot>
          </template>
          <slot name="item-card-header-title">
            <h3
              v-clean-tooltip="labelText(header.title)"
              :class="['item-card-header-title', variant]"
              :aria-label="labelText(header.title)"
              data-testid="item-card-header-title"
            >
              {{ labelText(header.title) }}
            </h3>
          </slot>
          <div
            v-if="header.statuses"
            class="item-card-header-statuses"
          >
            <div
              v-for="(status, i) in visibleStatuses"
              :key="i"
              class="item-card-header-statuses-status"
              :aria-label="labelText(status.tooltip)"
              data-testid="item-card-header-statuses-status"
            >
              <i
                v-clean-tooltip="labelText(status.tooltip)"
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
            aria-label="Card content"
            data-testid="item-card-content"
          >
            <p>{{ labelText(content) }}</p>
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

    ::v-deep img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }

    &.small {
      width: 32px;
      height: 32px;
      margin-right: 12px;

      ::v-deep img {
        width: 24px;
        height: 24px;
      }
    }
  }

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 24px;
    color: var(--body-text);

    &-title {
      max-width: 60%;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 0px;
      line-height: 24px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;

      &.small {
        max-width: 150px;
      }
    }

    &-statuses {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-left: auto;

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

      ::v-deep .icon {
        font-size: 16px;
        color: var(--body-text);
      }
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
    margin-top: 8px;
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
