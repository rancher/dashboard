<script setup>
import LazyImage from '@shell/components/LazyImage';

const emit = defineEmits(['card-click', 'repo-click', 'category-click', 'tag-click']);

defineProps({
  title: {
    type:     String,
    required: true
  },
  description: {
    type:     String,
    required: true
  },
  logo: {
    type:    String,
    default: ''
  },
  logoAltText: {
    type:    String,
    default: 'logo'
  },
  featured: {
    type:    Boolean,
    default: false
  },
  asLink: {
    type:    Boolean,
    default: false
  },
  deprecated: {
    type:    Boolean,
    default: false
  },
  upgradable: {
    type:    Boolean,
    default: false
  },
  installed: {
    type:    Boolean,
    default: false
  },
  version: {
    type:    String,
    default: ''
  },
  repo: {
    type:    String,
    default: ''
  },
  categories: {
    type:    Array,
    default: () => []
  },
  tags: {
    type:    Array,
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
    class="app-card"
    :class="{ asLink }"
    role="button"
    tabindex="0"
    data-testid="app-card"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
  >
    <div
      class="left-section"
      data-testid="app-card-logo-wrapper"
    >
      <div class="logo">
        <LazyImage
          :src="logo"
          :alt="logoAltText"
          data-testid="app-card-logo"
        />
      </div>
      <div
        v-if="featured"
        v-clean-tooltip="t('generic.featured')"
        class="featured"
        data-testid="app-card-badge-featured"
      >
        {{ t('generic.shortFeatured') }}
      </div>
    </div>

    <div class="right-section">
      <div class="header">
        <div class="header-content">
          <h3
            v-clean-tooltip="title"
            class="title"
            data-testid="app-card-title"
          >
            {{ title }}
          </h3>
          <div class="status-icons">
            <i
              v-if="deprecated"
              v-clean-tooltip="t('generic.deprecated')"
              class="icon icon-error deprecated"
              data-testid="app-card-status-deprecated"
            />
            <span
              v-if="upgradable"
              v-clean-tooltip="t('generic.upgradeable')"
              class="upgradable"
              data-testid="app-card-status-upgradable"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 6L6 10M10 6V14M10 6L14 10M1 10C1 11.1819 1.23279 12.3522 1.68508 13.4442C2.13738 14.5361 2.80031 15.5282 3.63604 16.364C4.47177 17.1997 5.46392 17.8626 6.55585 18.3149C7.64778 18.7672 8.8181 19 10 19C11.1819 19 12.3522 18.7672 13.4442 18.3149C14.5361 17.8626 15.5282 17.1997 16.364 16.364C17.1997 15.5282 17.8626 14.5361 18.3149 13.4442C18.7672 12.3522 19 11.1819 19 10C19 7.61305 18.0518 5.32387 16.364 3.63604C14.6761 1.94821 12.3869 1 10 1C7.61305 1 5.32387 1.94821 3.63604 3.63604C1.94821 5.32387 1 7.61305 1 10Z"
                  stroke="#3C98D3"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span
              v-if="installed"
              v-clean-tooltip="t('generic.installed')"
              class="installed"
              data-testid="app-card-status-installed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M7 10L9 12L13 8M1 10C1 11.1819 1.23279 12.3522 1.68508 13.4442C2.13738 14.5361 2.80031 15.5282 3.63604 16.364C4.47177 17.1997 5.46392 17.8626 6.55585 18.3149C7.64778 18.7672 8.8181 19 10 19C11.1819 19 12.3522 18.7672 13.4442 18.3149C14.5361 17.8626 15.5282 17.1997 16.364 16.364C17.1997 15.5282 17.8626 14.5361 18.3149 13.4442C18.7672 12.3522 19 11.1819 19 10C19 8.8181 18.7672 7.64778 18.3149 6.55585C17.8626 5.46392 17.1997 4.47177 16.364 3.63604C15.5282 2.80031 14.5361 2.13738 13.4442 1.68508C12.3522 1.23279 11.1819 1 10 1C8.8181 1 7.64778 1.23279 6.55585 1.68508C5.46392 2.13738 4.47177 2.80031 3.63604 3.63604C2.80031 4.47177 2.13738 5.46392 1.68508 6.55585C1.23279 7.64778 1 8.8181 1 10Z"
                  stroke="#30BA78"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </div>

          <!-- TODO: action menu -->
        </div>

        <div class="sub-header">
          <div
            v-if="version"
            class="version"
            data-testid="app-card-version"
          >
            <svg
              v-clean-tooltip="t('tableHeaders.version')"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="14"
              viewBox="0 0 16 14"
              fill="none"
            >
              <path
                d="M3.71429 2.71429V11.2857M1.14286 3.57143V10.4286M6.28572 2.71429C6.28572 2.25963 6.46633 1.82359 6.78782 1.5021C7.10931 1.18061 7.54535 1 8 1H13.1429C13.5975 1 14.0336 1.18061 14.355 1.5021C14.6765 1.82359 14.8571 2.25963 14.8571 2.71429V11.2857C14.8571 11.7404 14.6765 12.1764 14.355 12.4979C14.0336 12.8194 13.5975 13 13.1429 13H8C7.54535 13 7.10931 12.8194 6.78782 12.4979C6.46633 12.1764 6.28572 11.7404 6.28572 11.2857V2.71429Z"
                stroke="#717179"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p class="ml-10">
              {{ version }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="description"
        class="description"
        data-testid="app-card-description"
      >
        <p>{{ description }}</p>
      </div>

      <div class="specs">
        <div
          v-if="repo"
          class="spec-block no-card-click"
          data-testid="app-card-repo"
        >
          <span
            v-clean-tooltip="t('tableHeaders.repoName')"
            class="spec-icon"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M8.99981 17.3333C8.70751 17.3333 8.42028 17.257 8.16648 17.112L2.33314 13.772C1.81731 13.477 1.49981 12.932 1.49981 12.3412V5.65954C1.49981 5.06954 1.81731 4.52371 2.33314 4.22787L8.16648 0.887875C8.42028 0.742887 8.70751 0.666626 8.99981 0.666626C9.2921 0.666626 9.57934 0.742887 9.83314 0.887875L15.6665 4.22787C15.9191 4.37179 16.1293 4.57993 16.2756 4.83119C16.422 5.08246 16.4993 5.36793 16.4998 5.65871V12.3404C16.4998 12.9304 16.1823 13.4762 15.6665 13.772L9.83314 17.112C9.57934 17.257 9.2921 17.3333 8.99981 17.3333ZM8.99981 17.3333V9.00037M8.99981 9.00037L16.2748 4.80033M8.99981 9.00037L1.72442 4.80033"
                stroke="#717179"
                stroke-width="1.1"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <p
            class="spec-text"
            role="button"
            tabindex="0"
            data-testid="app-card-repo-text"
            @click="emit('repo-click', repo)"
            @keydown.enter="emit('repo-click', repo)"
          >
            {{ repo }}
          </p>
        </div>

        <div
          v-if="categories.length"
          class="spec-block no-card-click"
          data-testid="app-card-categories"
        >
          <span
            v-clean-tooltip="t('generic.category')"
            class="spec-icon"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M5.63158 4.78944C5.63158 5.6828 5.98647 6.53957 6.61817 7.17128C7.24987 7.80298 8.10664 8.15786 9 8.15786C9.89336 8.15786 10.7501 7.80298 11.3818 7.17128C12.0135 6.53957 12.3684 5.6828 12.3684 4.78944C12.3684 3.89608 12.0135 3.03931 11.3818 2.40761C10.7501 1.77591 9.89336 1.42102 9 1.42102C8.10664 1.42102 7.24987 1.77591 6.61817 2.40761C5.98647 3.03931 5.63158 3.89608 5.63158 4.78944Z"
                stroke="#717179"
                stroke-width="1.3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M1 13.2105C1 14.1039 1.35489 14.9606 1.98659 15.5923C2.61829 16.224 3.47506 16.5789 4.36842 16.5789C5.26178 16.5789 6.11855 16.224 6.75025 15.5923C7.38196 14.9606 7.73684 14.1039 7.73684 13.2105C7.73684 12.3171 7.38196 11.4604 6.75025 10.8287C6.11855 10.197 5.26178 9.84207 4.36842 9.84207C3.47506 9.84207 2.61829 10.197 1.98659 10.8287C1.35489 11.4604 1 12.3171 1 13.2105Z"
                stroke="#717179"
                stroke-width="1.3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M10.2632 13.2105C10.2632 14.1039 10.618 14.9606 11.2497 15.5923C11.8814 16.224 12.7382 16.5789 13.6316 16.5789C14.5249 16.5789 15.3817 16.224 16.0134 15.5923C16.6451 14.9606 17 14.1039 17 13.2105C17 12.3171 16.6451 11.4604 16.0134 10.8287C15.3817 10.197 14.5249 9.84207 13.6316 9.84207C12.7382 9.84207 11.8814 10.197 11.2497 10.8287C10.618 11.4604 10.2632 12.3171 10.2632 13.2105Z"
                stroke="#717179"
                stroke-width="1.3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span
            v-for="(category, i) in categories"
            :key="i"
            class="spec-text"
            role="button"
            tabindex="0"
            :data-testid="`app-card-category-${i}`"
            @click="emit('category-click', category)"
            @keydown.enter="emit('category-click', category)"
          >
            {{ category }}<span v-if="i !== categories.length - 1">, </span>
          </span>
        </div>

        <div
          v-if="tags.length"
          class="spec-block no-card-click"
          data-testid="app-card-tags"
        >
          <span
            v-clean-tooltip="t('generic.tags')"
            class="spec-icon"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M4.41638 5.24964C4.41638 5.47063 4.50417 5.68257 4.66044 5.83883C4.8167 5.9951 5.02864 6.08289 5.24964 6.08289C5.47063 6.08289 5.68257 5.9951 5.83883 5.83883C5.9951 5.68257 6.08289 5.47063 6.08289 5.24964C6.08289 5.02864 5.9951 4.8167 5.83883 4.66044C5.68257 4.50417 5.47063 4.41638 5.24964 4.41638C5.02864 4.41638 4.8167 4.50417 4.66044 4.66044C4.50417 4.8167 4.41638 5.02864 4.41638 5.24964Z"
                stroke="#717179"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M1.5 3.99976V8.30934C1.50009 8.75129 1.67573 9.1751 1.98829 9.48756L8.41266 15.9119C8.78925 16.2885 9.29999 16.5 9.83253 16.5C10.3651 16.5 10.8758 16.2885 11.2524 15.9119L15.9119 11.2524C16.2885 10.8758 16.5 10.3651 16.5 9.83253C16.5 9.29999 16.2885 8.78925 15.9119 8.41266L9.48756 1.98829C9.1751 1.67573 8.75129 1.50009 8.30934 1.5H3.99976C3.33678 1.5 2.70096 1.76337 2.23216 2.23216C1.76337 2.70096 1.5 3.33678 1.5 3.99976Z"
                stroke="#717179"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span
            v-for="(tag, i) in tags"
            :key="i"
            class="spec-text"
            role="button"
            tabindex="0"
            :data-testid="`app-card-tag-${i}`"
            @click="emit('tag-click', tag)"
            @keydown.enter="emit('tag-click', tag)"
          >
            {{ tag }}<span v-if="i !== tags.length - 1">, </span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-card {
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

  .logo {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: #fff;
    border-radius: var(--border-radius);

    img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
  }

  .featured {
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

  .status-icons {
    display: flex;
    align-items: flex-start;
    gap: var(--gap-md);

    .icon {
      font-size: 21px;
    }

    .deprecated {
      color: var(--error);
    }
    .upgradable {
      color: var(--info);
    }
    .installed {
      color: var(--success);
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
    color: var(--input-label);

    .version {
      display: flex;
      align-items: center;
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
  color: var(--input-label);
  gap: var(--gap) var(--gap-md);

  .spec-block {
    display: flex;
    align-items: center;

    .spec-icon {
      width: 16px;
      height: 16px;
      color: var(--input-label);
    }

    .spec-text {
      margin-left: 8px;
      text-transform: capitalize;
      text-decoration: underline;

      &:hover {
        text-decoration: none;
      }
    }
  }
}

</style>
