<script setup lang="ts">
import { PropType, computed } from 'vue';
import LazyImage from '@shell/components/LazyImage';

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

const props = defineProps({
  id: {
    type:     String,
    required: true
  },
  value: {
    type:     Object,
    required: true
  },
  header: {
    type:     Object as PropType<Header>,
    required: true
  },
  content: {
    type:    Object as PropType<Label>,
    default: null
  },
  variant: {
    type:    String,
    default: 'medium'
  },
  pill: { // can be visible only when the card's variant is NOT small
    type:    Object as PropType<Pill>,
    default: null
  },
  handleCardClick: {
    type:    Function,
    default: null
  }
});

const cardClickable = computed(() => typeof props.handleCardClick === 'function');

function _handleCardClick(e) {
  // Prevent card click if the user clicks on an inner actionable element like repo, category, or tag
  if (e.target.closest('.no-card-click')) {
    return;
  }

  props.handleCardClick?.(props.value);
}

</script>

<template>
  <div
    :class="['item-card', variant]"
    :role="cardClickable ? 'button' : undefined"
    :tabindex="cardClickable ? '0' : undefined"
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
            :alt="header.image.alt.key ? t(header.image.alt.key) : header.image.alt.text"
            data-testid="item-card-image"
          />
        </slot>
      </div>
      <slot name="item-card-pill">
        <div
          v-if="pill"
          v-clean-tooltip="pill.tooltip.key ? t(pill.tooltip.key) : pill.tooltip.text"
          class="item-card-pill"
          data-testid="item-card-pill"
        >
          {{ pill.label.key ? t(pill.label.key).slice(0, 4) : pill.label.text.slice(0, 4) }}
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
                :alt="header.image.alt.key ? t(header.image.alt.key) : header.image.alt.text"
                data-testid="item-card-header-image"
              />
            </slot>
          </div>
        </div>
        <slot name="item-card-header-title">
          <h3
            v-clean-tooltip="header.title.key ? t(header.title.key) : header.title.text"
            :class="['item-card-header-title', variant]"
            data-testid="item-card-header-title"
          >
            {{ header.title.key ? t(header.title.key) : header.title.text }}
          </h3>
        </slot>
        <div
          v-if="header.statuses"
          class="item-card-header-statuses"
        >
          <div
            v-for="(status, i) in header.statuses.slice(0, 3)"
            :key="i"
          >
            <i
              v-clean-tooltip="status.tooltip.key ? t(status.tooltip.key) : status.tooltip.text"
              :class="['icon', status.icon, status.color]"
              :style="{color: status.customColor}"
              :data-testid="`item-card-header-status-${id}`"
            />
          </div>
        </div>

        <div class="item-card-header-action-menu no-card-click">
          <slot name="item-card-actions" />
        </div>
      </div>
      <div class="item-card-sub-header">
        <slot name="item-card-sub-header" />
      </div>
      <div
        v-if="content"
        class="item-card-content"
        data-testid="item-card-content"
      >
        <slot name="item-card-content">
          <p>{{ content.key ? t(content.key) : content.text }}</p>
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
        font-size: 21px;

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
      margin-right: -8px;

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
  }

  &-content {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 21px;
    word-break: break-word;
    margin-top: 8px;
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
