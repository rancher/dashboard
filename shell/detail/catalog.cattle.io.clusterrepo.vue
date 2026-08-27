<script>
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab';
import LiveDate from '@shell/components/formatter/LiveDate';
import { RcIcon } from '@components/RcIcon';
import { SECRET } from '@shell/config/types';
import { REPO } from '@shell/config/query-params';
import { isUIPlugin } from '@shell/config/uiplugins';
import { requireAsset } from '@shell/utils/require-asset';

/**
 * Convert a git remote (https, scp-like `git@host:org/repo`, or ssh) into a
 * browseable web base URL + host. Returns null when it can't be normalized.
 */
export function parseGitWeb(gitRepo) {
  if ( !gitRepo ) {
    return null;
  }

  let s = gitRepo.trim();

  // scp-like syntax: git@github.com:org/repo(.git)
  const scp = s.match(/^git@([^:]+):(.+)$/);

  if ( scp ) {
    s = `https://${ scp[1] }/${ scp[2] }`;
  }

  s = s.replace(/^ssh:\/\/git@/i, 'https://').replace(/^git:\/\//i, 'https://');

  if ( !/^https?:\/\//i.test(s) ) {
    return null;
  }

  try {
    const u = new URL(s);

    u.username = '';
    u.password = '';
    const base = `${ u.origin }${ u.pathname }`.replace(/\.git\/?$/i, '').replace(/\/$/, '');

    return { host: u.host.toLowerCase(), base };
  } catch (e) {
    return null;
  }
}

export default {
  name: 'ClusterRepoDetail',

  components: {
    ResourceTabs, Tab, LiveDate, RcIcon
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    // Load the catalog so we can count the charts provided by this repository
    try {
      await this.$store.dispatch('catalog/load');
    } catch (e) {
      // Non-fatal: the charts count simply won't be shown
    }
  },

  computed: {
    isGit() {
      return this.value.isGit;
    },

    isOci() {
      return this.value.isOciType;
    },

    commit() {
      return this.value.status?.commit;
    },

    gitWeb() {
      if ( !this.isGit ) {
        return null;
      }

      const parsed = parseGitWeb(this.value.spec?.gitRepo);

      if ( !parsed ) {
        return null;
      }

      let provider = null;

      if ( parsed.host.includes('github') ) {
        provider = 'github';
      } else if ( parsed.host.includes('gitlab') ) {
        provider = 'gitlab';
      }

      return provider ? { ...parsed, provider } : null;
    },

    commitLink() {
      if ( !this.gitWeb || !this.commit ) {
        return null;
      }

      const { base, provider } = this.gitWeb;

      return provider === 'gitlab' ? `${ base }/-/commit/${ this.commit }` : `${ base }/commit/${ this.commit }`;
    },

    branchLink() {
      const branch = this.value.spec?.gitBranch;

      if ( !this.gitWeb || !branch ) {
        return null;
      }

      const { base, provider } = this.gitWeb;

      return provider === 'gitlab' ? `${ base }/-/tree/${ branch }` : `${ base }/tree/${ branch }`;
    },

    downloadTime() {
      return this.value.status?.downloadTime;
    },

    repoVisual() {
      if ( this.value.isSuseAppCollection ) {
        return {
          src:      requireAsset('@shell/assets/images/content/suse.svg'),
          titleKey: 'catalog.repo.target.suseAppCollection.title',
        };
      }

      if ( this.isOci ) {
        return {
          src:      requireAsset('@shell/assets/images/providers/oci-open-containers.svg'),
          titleKey: 'catalog.repo.target.oci.title',
        };
      }

      if ( this.isGit ) {
        return { icon: 'git', titleKey: 'catalog.repo.target.git.title' };
      }

      return { icon: 'helm', titleKey: 'catalog.repo.target.http.title' };
    },

    url() {
      return this.value.urlDisplay;
    },

    /**
     * Href to open the repository in a browser, or null when the URL isn't a
     * browseable web page. Git remotes (e.g. git.rancher.io) are only linked
     * when hosted on a recognized provider; otherwise they 404 in a browser.
     */
    urlLink() {
      if ( this.isGit ) {
        return this.gitWeb?.base || null;
      }

      // Helm index URLs are browseable; OCI (oci://...) URLs are not
      return /^https?:\/\//i.test(this.url || '') ? this.url : null;
    },

    authSecret() {
      return this.value.spec?.clientSecret;
    },

    authLocation() {
      const secret = this.authSecret;

      if ( !secret?.name || !secret?.namespace ) {
        return null;
      }

      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          product:   'explorer',
          cluster:   this.$route.params.cluster,
          resource:  SECRET,
          namespace: secret.namespace,
          id:        secret.name,
        },
      };
    },

    authDisplay() {
      const secret = this.authSecret;

      if ( !secret?.name ) {
        return this.t('generic.none');
      }

      return secret.namespace ? `${ secret.namespace }/${ secret.name }` : secret.name;
    },

    repoCharts() {
      const charts = this.$store.getters['catalog/charts'] || [];

      return charts.filter((c) => c.repoKey === this.value._key);
    },

    /**
     * Total number of charts this repository hosts, excluding UI extensions
     * (shown separately). The Apps > Charts page can still show fewer than this,
     * which the label's tooltip explains.
     */
    chartCount() {
      return this.repoCharts.filter((c) => !isUIPlugin(c)).length;
    },

    /**
     * Number of UI extension (plugin) charts, surfaced on the Extensions page
     * rather than the Apps > Charts page.
     */
    extensionCount() {
      return this.repoCharts.filter((c) => isUIPlugin(c)).length;
    },

    chartsLocation() {
      return {
        name:   'c-cluster-apps-charts',
        params: { cluster: this.$route.params.cluster },
        query:  { [REPO]: this.value._key },
      };
    },

    extensionsLocation() {
      return {
        name:   'c-cluster-uiplugins',
        params: { cluster: this.$route.params.cluster },
        hash:   '#available',
      };
    },

    caBundleDisplay() {
      return this.value.spec?.caBundle ? this.t('generic.yes') : this.t('generic.none');
    },

    skipTlsDisplay() {
      return this.value.spec?.insecureSkipTLSVerify ? this.t('generic.yes') : this.t('generic.no');
    },

    insecurePlainHttpDisplay() {
      return this.value.spec?.insecurePlainHttp ? this.t('generic.yes') : this.t('generic.no');
    },

    backOffDisplay() {
      const backOff = this.value.spec?.exponentialBackOffValues;

      if ( !backOff || ( backOff.minWait === undefined && backOff.maxWait === undefined && backOff.maxRetries === undefined ) ) {
        return this.t('generic.none');
      }

      const dash = '—';

      return `${ backOff.minWait ?? dash } / ${ backOff.maxWait ?? dash } / ${ backOff.maxRetries ?? dash }`;
    },
  },
};
</script>

<template>
  <ResourceTabs
    :value="value"
    mode="view"
    default-tab="overview"
    :need-events="false"
  >
    <Tab
      name="overview"
      :label="t('catalog.repo.detail.overview')"
      :weight="1"
    >
      <h3>{{ t('catalog.repo.detail.source') }}</h3>
      <div class="row mb-20">
        <div class="col span-3">
          <label class="text-label">{{ t('catalog.repo.detail.type') }}</label>
          <div class="value repo-type">
            <RcIcon
              v-if="repoVisual.icon"
              :type="repoVisual.icon"
              size="small"
            />
            <img
              v-else-if="repoVisual.src"
              :src="repoVisual.src"
              alt=""
              class="repo-type__img"
            >
            <span>{{ t(repoVisual.titleKey) }}</span>
          </div>
        </div>
        <div class="col span-6">
          <label class="text-label">{{ t('tableHeaders.url') }}</label>
          <div class="value">
            <a
              v-if="urlLink"
              :href="urlLink"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ url }}</a>
            <template v-else>
              {{ url }}
            </template>
          </div>
        </div>
      </div>

      <div
        v-if="isGit"
        class="row mb-20"
      >
        <div class="col span-3">
          <label class="text-label">{{ t('tableHeaders.branch') }}</label>
          <div class="value">
            <a
              v-if="branchLink"
              :href="branchLink"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ value.branchDisplay }}</a>
            <template v-else>
              {{ value.branchDisplay }}
            </template>
          </div>
        </div>
        <div class="col span-9">
          <label class="text-label">{{ t('tableHeaders.commit') }}</label>
          <div class="value">
            <a
              v-if="commitLink"
              :href="commitLink"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ commit }}</a>
            <template v-else>
              {{ commit || t('generic.none') }}
            </template>
          </div>
        </div>
      </div>

      <h3>{{ t('catalog.repo.detail.status') }}</h3>
      <div class="row mb-20">
        <div class="col span-6">
          <label class="text-label charts-label">
            {{ t('catalog.repo.detail.charts.label') }}
            <i
              v-clean-tooltip="t('catalog.repo.detail.charts.tooltip')"
              class="icon icon-info charts-label__info"
            />
          </label>
          <router-link
            v-if="chartCount > 0"
            :to="chartsLocation"
            class="value chart-link"
          >
            {{ t('catalog.repo.detail.charts.count', { count: chartCount }) }}
          </router-link>
          <div
            v-else-if="extensionCount === 0"
            class="value"
          >
            {{ t('catalog.repo.detail.charts.count', { count: 0 }) }}
          </div>
          <router-link
            v-if="extensionCount > 0"
            :to="extensionsLocation"
            class="value chart-link"
          >
            {{ t('catalog.repo.detail.extensions.count', { count: extensionCount }) }}
          </router-link>
        </div>
        <div class="col span-6">
          <label class="text-label">{{ t('catalog.repo.downloaded.label') }}</label>
          <div class="value">
            <LiveDate
              v-if="downloadTime"
              :value="downloadTime"
              :add-suffix="true"
            />
            <template v-else>
              {{ t('generic.none') }}
            </template>
          </div>
        </div>
      </div>

      <h3>{{ t('catalog.repo.detail.security') }}</h3>
      <div class="row mb-20">
        <div class="col span-6">
          <label class="text-label">{{ t('catalog.repo.detail.authentication') }}</label>
          <div class="value">
            <router-link
              v-if="authLocation"
              :to="authLocation"
            >
              {{ authDisplay }}
            </router-link>
            <template v-else>
              {{ authDisplay }}
            </template>
          </div>
        </div>
        <template v-if="isOci">
          <div class="col span-3">
            <label class="text-label">{{ t('catalog.repo.oci.skipTlsVerifications') }}</label>
            <div class="value">
              {{ skipTlsDisplay }}
            </div>
          </div>
          <div class="col span-3">
            <label class="text-label">{{ t('catalog.repo.oci.insecurePlainHttp') }}</label>
            <div class="value">
              {{ insecurePlainHttpDisplay }}
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="isOci"
        class="row mb-20"
      >
        <div class="col span-6">
          <label class="text-label">{{ t('catalog.repo.detail.caBundle') }}</label>
          <div class="value">
            {{ caBundleDisplay }}
          </div>
        </div>
        <div class="col span-6">
          <label class="text-label">{{ t('catalog.repo.detail.exponentialBackOff') }}</label>
          <div class="value">
            {{ backOffDisplay }}
          </div>
        </div>
      </div>
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
.value {
  font-size: 14px;
  line-height: $input-line-height;
  margin-top: 4px;
}

.chart-link {
  display: block;
  width: fit-content;
}

.charts-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &__info {
    color: var(--muted);
    font-size: 14px;
  }
}

.repo-type {
  display: flex;
  align-items: center;
  gap: 6px;

  &__img {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }
}
</style>
