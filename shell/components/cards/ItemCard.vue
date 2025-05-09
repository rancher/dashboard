<script setup lang="ts">
import { PropType } from 'vue';
import LazyImage from '@shell/components/LazyImage';

type Label = {
  key?: string;
  text?: string;
}

type Image = {
  src: string;
  alt: Label;
};

type Pill = {
  label: Label;
  tooltip: Label;
};

type Status = {
  icon: string;
  color: string;
  customColor: string;
  tooltip: Label;
  handleClick: () => void;
}

type SubTitleGroup = {
  icon?: string;
  iconTooltip?: Label;
  labels: Label[]
  handleClick: () => void;
}

type BottomGroup = {
  icon?: string;
  iconTooltip?: Label;
  labels: Label[]
  handleClick: () => void;
}

const emit = defineEmits(['card-click']);

defineProps({
  id: {
    type:     String,
    required: true
  },
  title: {
    type:     Object as PropType<Label>,
    required: true
  },
  subTitleGroups: {
    type:    Array as PropType<SubTitleGroup[]>,
    default: null
  },
  description: {
    type:    Object as PropType<Label>,
    default: null
  },
  image: {
    type:    Object as PropType<Image>,
    default: null
  },
  pill: {
    type:    Object as PropType<Pill>,
    default: null
  },
  asLink: {
    type:    Boolean,
    default: false
  },
  statuses: {
    type:    Array as PropType<Status[]>,
    default: null
  },
  bottomGroups: {
    type:    Array as PropType<BottomGroup[]>,
    default: () => []
  }
});

function handleCardClick(e) {
  // Prevent card click if the user clicks on an inner actionable element like repo, category, or tag
  if (e.target.closest('.no-card-click')) {
    return;
  }

  emit('card-click');
}

</script>

<template>
  <div
    class="item-card"
    :class="{ asLink }"
    role="button"
    tabindex="0"
    :data-testid="`item-card-${id}`"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
  >
    <div
      class="left-section"
      data-testid="item-card-image-wrapper"
    >
      <div
        v-if="image"
        class="item-card-image"
      >
        <slot name="image">
          <LazyImage
            :src="image.src"
            :alt="image.alt.key ? t(image.alt.key) : image.alt.text"
            data-testid="item-card-image"
          />
        </slot>
      </div>
      <div
        v-if="pill"
        v-clean-tooltip="pill.tooltip.key ? t(pill.tooltip.key) : pill.tooltip.text"
        class="item-card-pill"
        data-testid="item-card-pill"
      >
        {{ pill.label.key ? t(pill.label.key) : pill.label.text }}
      </div>
    </div>

    <div class="right-section">
      <div class="header">
        <div class="header-content">
          <h3
            v-clean-tooltip="title.key ? t(title.key) : title.text"
            class="title"
            data-testid="item-card-title"
          >
            {{ title.key ? t(title.key) : title.text }}
          </h3>
          <div
            v-if="statuses"
            class="statuses"
          >
            <div
              v-for="(status, i) in statuses.slice(0, 3)"
              :key="i"
            >
              <i
                v-clean-tooltip="status.tooltip.key ? t(status.tooltip.key) : status.tooltip.text"
                :class="['icon', status.icon, status.color]"
                :style="{color: status.customColor}"
                :data-testid="`item-card-status-${status.id}`"
              />
            </div>
          </div>

          <!-- TODO: action menu -->
        </div>

        <div
          v-if="subTitleGroups.length"
          class="sub-header"
        >
          <div
            v-for="(subTitle, i) in subTitleGroups"
            :key="i"
            class="sub-title-item"
            data-testid="item-card-version"
          >
            <i
              v-if="subTitle.icon"
              v-clean-tooltip="subTitle.iconTooltip.key ? t(subTitle.iconTooltip.key) : subTitle.iconTooltip.text"
              :class="['icon', subTitle.icon]"
            />
            <p
              v-for="(label, j) in subTitle.labels"
              :key="j"
            >
              {{ label.key ? t(label.key) : label.text }}<span v-if="subTitle.labels.length > 1 && i !== subTitle.labels.length - 1">, </span>
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="description"
        class="description"
        data-testid="item-card-description"
      >
        <p>{{ description.key ? t(description.key) : description.text }}</p>
      </div>
      <div
        v-if="bottomGroups.length"
        class="specs"
      >
        <template
          v-for="(bottomGroup, i) in bottomGroups"
          :key="i"
        >
          <div
            v-if="bottomGroup.labels.length"
            class="spec-block no-card-click"
            data-testid="item-card-repo"
          >
            <i
              v-if="bottomGroup.icon"
              v-clean-tooltip="bottomGroup.iconTooltip.key ? t(bottomGroup.iconTooltip.key) : bottomGroup.iconTooltip.text"
              :class="['icon', 'spec-icon', bottomGroup.icon]"
            />
            <p
              v-for="(label, j) in bottomGroup.labels"
              :key="j"
              class="spec-text secondary-text-link"
              role="button"
              tabindex="0"
              data-testid="item-card-repo-text"
              @click="label.handleClick?.(label)"
              @keydown.enter="label.handleClick?.(label)"
            >
              {{ label.key ? t(label.key) : label.text }}<span v-if="bottomGroup.labels.length > 1 && j !== bottomGroup.labels.length - 1">, </span>
            </p>
          </div>
        </template>
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

  &.asLink {
    cursor: pointer;
  }
}

.left-section {
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
    padding: 0 8px;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius);
    background: var(--default);
    text-transform: uppercase;
    color: var(--disabled-text);
    font-size: 10px;
    font-weight: 600;
    line-height: 19px;
  }
}

.right-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--gap-md);
  flex: 1;

  .statuses {
    display: flex;
    align-items: flex-start;
    gap: var(--gap-md);

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
}

.header {
  display: flex;
  flex-direction: column;
  width: 100%;
  color: var(--body-text);

  .header-content {
    display: flex;
    justify-content: space-between;

    .title {
      max-width: 250px;
      font-weight: 600;
      margin-bottom: 8px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  .sub-header {
    display: flex;
    justify-content: flex-start;
    gap: var(--gap-md);
    color: var(--link-text-secondary);

    .sub-title-item {
      display: flex;
      align-items: center;

      .icon {
        font-size: 16px;
        margin-right: 8px;
      }
    }
  }
}

.description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 21px;
  word-break: break-word;
}

.specs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  color: var(--link-text-secondary);
  gap: var(--gap) var(--gap-md);

  .spec-block {
    display: flex;
    align-items: center;

    .spec-icon {
      font-size: 16px;
    }

    .spec-text {
      margin-left: 8px;
      text-transform: capitalize;
    }
  }
}

</style>
