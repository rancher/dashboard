<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { Banner } from '@components/Banner';
import ChartReadme from '@shell/components/ChartReadme';
import { ZERO_TIME } from '@shell/config/types';
import day from 'dayjs';

const props = defineProps({
  version: {
    type:    Object,
    default: null,
  },
  versionInfo: {
    type:    Object,
    default: null,
  },
  versionInfoError: {
    type:    String,
    default: '',
  },
  versions: {
    type:    Array,
    default: () => [],
  },
  totalVersions: {
    type:    Number,
    default: 0,
  },
  repo: {
    type:    Object,
    default: null,
  },
  chart: {
    type:    Object,
    default: null,
  },
  currentVersion: {
    type:    String,
    default: '',
  },
  appVersion: {
    type:    String,
    default: '',
  },
  home: {
    type:    String,
    default: '',
  },
  maintainers: {
    type:    Array,
    default: () => [],
  },
});

const emit = defineEmits(['toggle-versions', 'select-version']);

const store = useStore();
const { t } = useI18n(store);

const showMoreVersions = ref(false);
const showLastVersions = 7;

const hasReadme = computed(() => !!props.versionInfo?.appReadme || !!props.versionInfo?.readme);

const displayedVersions = computed(() => {
  if (props.versions.length) {
    return props.versions;
  }

  return [];
});

const visibleVersions = computed(() => {
  return showMoreVersions.value ? displayedVersions.value : displayedVersions.value.slice(0, showLastVersions);
});

const canShowMore = computed(() => displayedVersions.value.length > showLastVersions);

const formatVersionDate = (date: string): string => {
  if (!date || date === ZERO_TIME) {
    return t('generic.na');
  }

  return day(date).format('MMM D, YYYY');
};
</script>

<template>
  <div>
    <Banner
      v-if="versionInfoError"
      color="error"
      :label="versionInfoError"
    />

    <slot name="banners" />

    <div class="chart-body">
      <ChartReadme
        v-if="hasReadme"
        :version-info="versionInfo"
        :show-app-readme="false"
        :hide-readme-first-title="false"
        class="chart-body__readme"
      />
      <div
        v-else
        class="chart-body__readme"
      >
        {{ t('catalog.install.appReadmeMissing', {}, true) }}
      </div>

      <aside
        v-if="version"
        class="chart-body__info"
      >
        <div class="chart-body__info-section">
          <h4>{{ t('catalog.chart.info.chartVersions.label') }}</h4>
          <div
            v-for="vers of visibleVersions"
            :key="vers.id"
            class="chart-body__info-section--versions"
            data-testid="chart-versions"
          >
            <b
              v-if="vers.originalVersion === version.version"
              v-clean-tooltip="vers.label"
              class="current-version"
            >
              <template v-if="currentVersion && vers.originalVersion === currentVersion">
                <span class="ellipsis">{{ currentVersion }}</span>
                <i class="icon icon-confirmation-alt" />
              </template>
              <span
                v-else
                class="ellipsis"
              >
                {{ vers.originalVersion }}
              </span>
            </b>
            <div
              v-else
              class="current-version"
            >
              <a
                v-clean-tooltip="vers.label"
                href="#"
                class="ellipsis"
                data-testid="chart-version-link"
                @click.prevent="emit('select-version', vers)"
              >
                {{ currentVersion && vers.originalVersion === currentVersion ? currentVersion : vers.originalVersion }}
              </a>
              <i
                v-if="currentVersion && vers.originalVersion === currentVersion"
                class="icon icon-confirmation-alt"
              />
            </div>
            <p
              v-clean-tooltip="{ content: formatVersionDate(vers.created), placement: 'left' }"
              class="version-date"
            >
              {{ formatVersionDate(vers.created) }}
            </p>
          </div>
          <a
            v-if="canShowMore"
            href="#"
            role="button"
            class="mmt-1 secondary-text-link"
            data-testid="chart-show-more-versions"
            @click.prevent="showMoreVersions = !showMoreVersions"
          >
            {{ t(`catalog.chart.info.chartVersions.${showMoreVersions ? 'showLess' : 'showMore'}`) }}
          </a>
        </div>

        <div
          v-if="appVersion"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.appVersion') }}</h4>
          {{ appVersion }}
        </div>

        <div
          v-if="repo"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.repository') }}</h4>
          <router-link
            :to="repo.detailLocation"
            data-testid="chart-repo-link"
          >
            {{ chart?.repoNameDisplay }}
          </router-link>
        </div>

        <div
          v-if="home"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.home') }}</h4>
          <a
            :href="home"
            rel="nofollow noopener noreferrer"
            target="_blank"
            data-testid="chart-home-link"
          >{{ home }}<i class="icon icon-external-link" /><span class="sr-only">{{ t('generic.opensInNewTab') }}</span></a>
        </div>

        <div class="chart-body__info-section">
          <h4>{{ t('catalog.chart.info.maintainers') }}</h4>
          <template v-if="maintainers.length">
            <div
              v-for="m of maintainers"
              :key="m.id"
            >
              <a
                v-if="m.href"
                v-clean-tooltip="m.name ? t('catalog.chart.info.maintainerContactTooltip', { maintainer: m.name }) : undefined"
                :href="m.href"
                rel="nofollow noopener noreferrer"
                target="_blank"
              >
                {{ m.label }}
              </a>
              <span v-else>{{ m.label }}</span>
            </div>
          </template>
          <span v-else>{{ t('generic.unknown') }}</span>
        </div>

        <div
          v-if="version.sources"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.related') }}</h4>
          <a
            v-for="s of version.sources"
            :key="s"
            :href="s"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ s }}<i class="icon icon-external-link" /><span class="sr-only">{{ t('generic.opensInNewTab') }}</span></a>
        </div>

        <div
          v-if="version.urls"
          class="chart-body__info-section"
        >
          <h4>{{ t('catalog.chart.info.chartUrls') }}</h4>
          <a
            v-for="url of version.urls"
            :key="url"
            :href="url"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ version.urls.length === 1 ? t('generic.download') : url }}<span class="sr-only">{{ t('generic.opensInNewTab') }}</span></a>
        </div>

        <slot name="sidebar-extra" />
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart-body {
  display: flex;

  &__readme {
    flex: 1;
    min-width: 400px;
    padding: 12px 24px;
  }

  &__info {
    min-width: 300px;
    max-width: 300px;
    height: max-content;
    background: var(--sortable-table-header-bg);
    padding: 16px;
    border-radius: 8px;
    margin-left: 24px;

    &-section {
      display: flex;
      flex-direction: column;
      padding-bottom: 24px;
      word-break: break-all;
      line-height: 21px;

      h4 {
        font-weight: bold;
      }

      a {
        cursor: pointer;

        .icon-external-link {
          margin-left: 8px;
        }
      }

      &--versions {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;

        .version-date {
          color: var(--link-text-secondary);
        }

        .current-version {
          display: flex;
          align-items: center;

          .ellipsis {
            display: block;
            max-width: 140px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .icon-confirmation-alt {
            color: var(--success);
            margin-left: 12px;
            font-size: 19px;
          }
        }
      }

      &--keywords {
        color: var(--link-text-secondary);
        padding-bottom: 0;

        .keyword-links {
          .keyword-item {
            display: inline-block;
            white-space: nowrap;

            span {
              margin-right: 4px;
              margin-left: -2px;
            }
          }
        }
      }
    }
  }
}
</style>
