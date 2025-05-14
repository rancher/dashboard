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
  image?: Image;
  title?: Label;
  statuses?: Status[];
}

type ItemValue = Record<string, any>;

const store = useStore();
const { t } = useI18n(store);

const emit = defineEmits<{( e: 'card-click', value: any): void; }>();

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
    :class="['item-card', variant]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? '0' : undefined"
    :data-testid="`item-card-${id}`"
    @click="_handleCardClick"
    @keydown.enter="_handleCardClick"
  >
    <div
      v-if="variant === 'medium'"
      class="side-section"
      data-testid="item-card-image-wrapper"
    >
      <div
        v-if="header.image"
        class="item-card-image"
      >
        <slot name="item-card-image">
          <LazyImage
            :src="header.image.src"
            :alt="labelText(header.image?.alt)"
            data-testid="item-card-image"
          />
        </slot>
      </div>
      <slot name="item-card-pill">
        <div
          v-if="pill"
          v-clean-tooltip="labelText(pill.tooltip)"
          class="item-card-pill"
          data-testid="item-card-pill"
        >
          {{ labelText(pill.label) }}
        </div>
      </slot>
    </div>

    <div class="main-section">
      <div :class="['item-card-header', variant]">
        <div
          v-if="variant === 'small'"
          data-testid="item-card-image-wrapper"
        >
          <div
            v-if="header.image"
            class="item-card-header-image"
          >
            <slot name="item-card-header-image">
              <LazyImage
                :src="header.image.src"
                :alt="labelText(header.image?.alt)"
                data-testid="item-card-header-image"
              />
            </slot>
          </div>
        </div>
        <slot name="item-card-header-title">
          <h3
            v-clean-tooltip="labelText(header.title)"
            :class="['item-card-header-title', variant]"
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
          >
            <i
              v-clean-tooltip="labelText(status.tooltip)"
              :class="['icon', status.icon, status.color]"
              :style="{color: status.customColor}"
              :data-testid="`item-card-header-status-${id}`"
            />
          </div>
        </div>

        <template v-if="$slots['item-card-actions']">
          <div class="item-card-header-action-menu no-card-click">
            <slot name="item-card-actions" />
          </div>
        </template>
      </div>

      <template v-if="$slots['item-card-sub-header']">
        <div class="item-card-sub-header">
          <slot name="item-card-sub-header" />
        </div>
      </template>

      <div
        v-if="content"
        class="item-card-content"
        data-testid="item-card-content"
      >
        <slot name="item-card-content">
          <p>{{ labelText(content) }}</p>
        </slot>
      </div>

      <div class="item-card-footer">
        <slot name="item-card-footer" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.item-card {
  display: flex;
  min-width: 420px;
  max-width: 580px;
  padding: 16px;
  align-items: flex-start;
  gap: var(--gap-lg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border);
  background: var(--body-bg);

  &:hover {
    border-color: var(--primary);
  }

  &.small {
    min-width: 320px;
  }

  &-header {
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: var(--body-text);

    &.small {
      align-items: center;
    }

    &-image {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      background: #fff;
      border-radius: var(--border-radius);

      ::v-deep img {
        width: 24px;
        height: 24px;
        object-fit: contain;
      }
    }

    &-title {
      max-width: 250px;
      font-weight: 600;
      margin-bottom: 0px;
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
      gap: var(--gap-md);
      margin-left: auto;
      margin-right: 4px;

      .icon {
        font-size: 23px;

        &.error {
          color: var(--error);
        }
        &.info {
          color: var(--info);
        }
        &.success {
          color: var(--success);
        }
      }
    }

    &-action-menu {
      margin-top: -4px;
      margin-right: -4px;

      ::v-deep .icon {
        font-size: 16px;
        color: var(--body-text)
      }
    }
  }

  &-sub-header {
    display: flex;
    justify-content: flex-start;
    gap: var(--gap-md);
    color: var(--link-text-secondary);
    margin-bottom: 8px;
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

  &-footer {
    display: flex;
    flex-wrap: wrap;
  }
}

.side-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-md);

  .item-card-image {
    width: 48px;
    height: 48px;
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
  }

  .item-card-pill {
    display: flex;
    width: 48px;
    padding: 4px 8px;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius);
    background: var(--default);
    text-transform: uppercase;
    color: var(--disabled-text);
    font-size: 10px;
    font-weight: 600;
  }
}

.main-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--gap);
  flex: 1;
}

</style>
