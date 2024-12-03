<script>
import semver from 'semver';
import { mapGetters } from 'vuex';
import { isAdminUser } from '@shell/store/type-map';
import AsyncButton from '@shell/components/AsyncButton';
import BrandImage from '@shell/components/BrandImage';
import TypeDescription from '@shell/components/TypeDescription';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import Loading from '@shell/components/Loading';
import { HARVESTER_NAME as VIRTUAL } from '@shell/config/features';
import { CAPI, HCI, MANAGEMENT, CATALOG } from '@shell/config/types';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { allHash } from '@shell/utils/promise';
import { NAME as APP_PRODUCT } from '@shell/config/product/apps';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { HARVESTER_CHART, HARVESTER_REPO } from '../types';
import {
  getHelmRepository,
  ensureHelmRepository,
  refreshHelmRepository,
  installHelmChart,
  getHelmChart,
  waitForUIExtension,
  waitForUIPackage,
} from '@shell/utils/ui-plugins';

export default {
  components: {
    AsyncButton,
    BrandImage,
    ResourceTable,
    Masthead,
    TypeDescription,
    Loading
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const _hash = {
      hciClusters:  this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.CLUSTER }),
      mgmtClusters: this.$store.dispatch(`${ inStore }/findAll`, { type: MANAGEMENT.CLUSTER }),
      catalogLoad:  this.$store.dispatch('catalog/load', { reset: true }),
    };

    const hash = await allHash(_hash);

    this.hciClusters = hash.hciClusters;
    this.mgmtClusters = hash.mgmtClusters;

    this.harvesterRepository = await this.getHarvesterRepository();
  },

  data() {
    const resource = CAPI.RANCHER_CLUSTER;

    return {
      isAdmin:         isAdminUser(this.$store.getters),
      navigating:      false,
      VIRTUAL,
      hciDashboard:    HCI.DASHBOARD,
      resource,
      hResource:       HCI.CLUSTER,
      realSchema:      this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      hciClusters:     [],
      mgmtClusters:    [],
      harvesterRepository: null,
      harvesterLatestVersion: null,
      harvesterRepositoryError: false,
      harvesterExtensionInstallError: false,
      harvesterExtensionUpdateError: false,
      clusterRepoLink: {
        name:   'c-cluster-product-resource',
        params: {
          cluster:  'local',
          product:  APP_PRODUCT,
          resource: CATALOG.CLUSTER_REPO
        }
      },
      extensionsLink: {
        name:   'c-cluster-uiplugins',
        params: { cluster: BLANK_CLUSTER }
      }
    };
  },

  watch: {
    async harvesterRepository(value) {
      if (value) {
        await refreshHelmRepository(value);

        if (this.harvester.extension) {
          await this.setHarvesterLatestVersion(value);
        }
      }
    }
  },

  computed: {
    ...mapGetters({ uiplugins: 'uiplugins/plugins' }),

    harvester() {
      const extension = this.uiplugins?.find((c) => c.name === HARVESTER_CHART.name);
      const missingRepository = !!extension && !this.harvesterRepository;
      const isLatestVersionAvailable = !!this.harvesterLatestVersion;

      const action = async (btnCb) => {
        const action = `${ !extension ? 'install' : 'update' }HarvesterExtension`;

        await this[action](btnCb);
      };

      const hasErrors = this.harvesterRepositoryError ||
        this.harvesterExtensionInstallError ||
        this.harvesterExtensionUpdateError;

      const panelLabel = [
        'warning',
        'prompt'
      ].reduce((acc, label) => {
        let action = '';

        if (hasErrors) {
          action = 'error';
        } else if (missingRepository) {
          action = 'missingRepo';
        } else if (isLatestVersionAvailable) {
          action = 'update';
        } else if (!extension) {
          action = 'install';
        }

        let key = `harvesterManager.extension.${ action }.${ label }`;

        if (label === 'prompt' && !this.isAdmin) {
          key = 'harvesterManager.extension.admin'
        }

        return {
          ...acc,
          [label]: this.t(key, {}, true),
        };
      }, {});

      return {
        extension,
        missingRepository,
        isLatestVersionAvailable,
        toInstall: !extension,
        toUpdate: missingRepository || isLatestVersionAvailable,
        action,
        panelLabel,
        hasErrors,
      };
    },

    importLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.schema.id,
        },
      };
    },

    canCreateCluster() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    },

    rows() {
      return this.hciClusters
        .filter((c) => {
          const cluster = this.mgmtClusters.find((cluster) => cluster?.metadata?.name === c?.status?.clusterName);

          return isHarvesterCluster(cluster);
        })
        .map((row) => {
          if (row.isReady) {
            row.setSupportedHarvesterVersion();
          }

          return row;
        });
    },

    typeDisplay() {
      return this.t(`typeLabel."${ HCI.CLUSTER }"`, { count: this.rows?.length || 0 });
    },
  },

  methods: {
    async getHarvesterRepository() {
      try {
        return await getHelmRepository(this.$store, HARVESTER_REPO.spec.gitRepo, HARVESTER_REPO.spec.gitBranch);
      } catch (error) {
        this.harvesterRepositoryError = true;
      }
    },

    async setHarvesterLatestVersion(repository) {
      try {
        const chart = await getHelmChart(this.$store, repository, HARVESTER_CHART.name);

        if (semver.gt(chart.version, this.harvester.extension.version)) {
          this.harvesterLatestVersion = chart.version;
        }
      } catch (error) {
        this.harvesterExtensionUpdateError = true;
      }
    },

    async installHarvesterExtension(btnCb) {
      let installed = false;

      try {
        const harvesterRepo = await ensureHelmRepository(this.$store, HARVESTER_REPO.spec.gitRepo, HARVESTER_CHART.name, HARVESTER_REPO.spec.gitBranch);

        const chart = await getHelmChart(this.$store, harvesterRepo, HARVESTER_CHART.name);

        await installHelmChart(harvesterRepo, { ...HARVESTER_CHART, version: chart.version }, {}, UI_PLUGIN_NAMESPACE, 'install');

        const extension = await waitForUIExtension(this.$store, HARVESTER_CHART.name);

        installed = await waitForUIPackage(this.$store, extension);
      } catch (error) {
      }

      this.harvesterExtensionInstallError = !installed;

      btnCb(installed);

      if (installed) {
        this.reload();
      }
    },

    async updateHarvesterExtension(btnCb) {
      let updated = false;

      try {
        let harvesterRepository = this.harvesterRepository;

        if (this.harvester.missingRepository) {
          harvesterRepository = await ensureHelmRepository(this.$store, HARVESTER_REPO.spec.gitRepo, HARVESTER_CHART.name, HARVESTER_REPO.spec.gitBranch);

          await this.setHarvesterLatestVersion(harvesterRepository);
        }

        await installHelmChart(harvesterRepository, { ...HARVESTER_CHART, version: this.harvesterLatestVersion }, {}, UI_PLUGIN_NAMESPACE, 'upgrade');

        const extension = await waitForUIExtension(this.$store, HARVESTER_CHART.name);

        updated = await waitForUIPackage(this.$store, { ...extension, version: this.harvesterLatestVersion });
      } catch (error) {
      }

      this.harvesterExtensionUpdateError = !updated;

      btnCb(updated);

      if (updated) {
        this.reload();
      }
    },

    reload() {
      this.$router.go();
    },

    async goToCluster(row) {
      const timeout = setTimeout(() => {
        // Don't show loading indicator for quickly fetched plugins
        this.navigating = row.id;
      }, 1000);

      try {
        await row.goToCluster();

        clearTimeout(timeout);
        this.navigating = false;
      } catch {
        // The error handling is carried out within goToCluster, but just in case something happens before the promise chain can catch it...
        clearTimeout(timeout);
        this.navigating = false;
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div v-if="!!harvester.extension">
      <Masthead
        :schema="realSchema"
        :resource="resource"
        :is-creatable="false"
        :type-display="typeDisplay"
      >
        <template #typeDescription>
          <TypeDescription :resource="hResource" />
        </template>

        <template
          v-if="canCreateCluster"
          #extraActions
        >
          <router-link
            :to="importLocation"
            class="btn role-primary"
          >
            {{ t('cluster.importAction') }}
          </router-link>
        </template>
      </Masthead>
      <ResourceTable
        v-if="rows && rows.length"
        :schema="schema"
        :rows="rows"
        :is-creatable="true"
        :namespaced="false"
        :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      >
        <template #col:name="{row}">
          <td>
            <span class="cluster-link">
              <a
                v-if="row.isReady && row.isSupportedHarvester"
                class="link"
                :disabled="navigating ? true : null"
                @click="goToCluster(row)"
              >{{ row.nameDisplay }}</a>
              <span v-else>
                {{ row.nameDisplay }}
              </span>
              <i
                class="icon icon-spinner icon-spin ml-5"
                :class="{'navigating': navigating === row.id}"
              />
            </span>
          </td>
        </template>

        <template #cell:harvester="{row}">
          <router-link
            class="btn btn-sm role-primary"
            :to="row.detailLocation"
          >
            {{ t('harvesterManager.manage') }}
          </router-link>
        </template>
      </ResourceTable>
      <div v-else>
        <div class="no-clusters">
          {{ t('harvesterManager.cluster.none') }}
        </div>
        <hr class="info-section">
      </div>
    </div>
    <template v-if="harvester.toInstall || harvester.toUpdate || !rows || !rows.length">
      <div class="logo">
        <BrandImage
          file-name="harvester.png"
          height="64"
        />
      </div>
      <template v-if="harvester.toInstall || !rows || !rows.length">
        <div class="tagline">
          <div>{{ t('harvesterManager.cluster.description') }}</div>
        </div>
        <div class="tagline">
          <div v-clean-html="t('harvesterManager.cluster.learnMore', {}, true)" />
        </div>
      </template>
      <template v-if="harvester.hasErrors || harvester.toInstall || harvester.toUpdate">
        <div v-if="harvester.hasErrors || harvester.toInstall || !rows || !rows.length" class="tagline">
          <div class="extensions-separator" />
        </div>
        <div class="tagline extension-warning-panel">
          <div
            v-clean-html="harvester.panelLabel.warning"
            class="extension-warning"
          />
          <div class="tagline">
            <div
              v-clean-html="harvester.panelLabel.prompt"
              class="extension-prompt"
            />
          </div>
        </div>
        <template v-if="isAdmin">
          <div
            v-if="harvester.hasErrors"
            class="extension-info"
          >
            <ol class="steps">
              <li>
                {{ t('harvesterManager.extension.install.steps.repo.1') }}
                <router-link :to="clusterRepoLink">
                  {{ t('harvesterManager.extension.install.steps.repo.2') }}
                </router-link>
                <span v-clean-html="t('harvesterManager.extension.install.steps.repo.3', {}, true)"></span>
              </li>
              <li>
                {{ t('harvesterManager.extension.install.steps.ui.1') }}
                <router-link :to="extensionsLink">
                  {{ t('harvesterManager.extension.install.steps.ui.2') }}
                </router-link>
                {{ t('harvesterManager.extension.install.steps.ui.3') }}
              </li>
            </ol>
          </div>
          <div
            v-else
            class="tagline"
          >
            <AsyncButton
              :mode="harvester.toInstall ? 'install' : 'update'"
              @click="harvester.action"
            />
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  .cluster-link {
    display: flex;
    align-items: center;

    .icon {
      // Use visibility to avoid the columns re-adjusting when the icon is shown
      visibility: hidden;

      &.navigating {
        visibility: visible;
      }
    }

  }
  .no-clusters {
    text-align: center;
  }

  .info-section {
    margin-top: 60px;
  }

  .logo {
    display: flex;
    justify-content: center;
    margin: 60px 0 40px 0;
  }

  .tagline {
    display: flex;
    justify-content: center;
    margin-top: 30px;

    > div {
      font-size: 16px;
      line-height: 22px;
      max-width: 80%;
      text-align: center;
    }
  }

  .extensions-separator {
    border: 1px solid var(--border);
    width: 50%;
  }

  .extension-warning-panel {
    align-items: center;
    flex-direction: column;
  }

  .extension-warning {
    font-size: 24px !important;
    font-weight: 400;
  }

  .extension-info {
    display: flex;
    justify-content: center;

    .steps {
      > li {
        margin-top: 5px;
        font-size: 14px;
      }
    }
  }

   .link {
    cursor: pointer;
  }

</style>
