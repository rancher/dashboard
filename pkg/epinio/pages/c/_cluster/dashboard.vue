<script lang="ts">
import { getVersionInfo } from '@shell/utils/version';
import Vue from 'vue';
import DashboardCard from '../../../components/dashboard/Cards.vue';
import { createEpinioRoute } from '../../../utils/custom-routing';
import { EpinioApplicationResource, EpinioCatalogService, EPINIO_TYPES } from '../../../types';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import Namespace from '@shell/models/namespace';
import EpinioServiceModel from '../../../models/services';
import isEqual from 'lodash/isEqual';
import { sortBy } from 'lodash';

export default Vue.extend<any, any, any, any>({
  components: { DashboardCard, ConsumptionGauge },
  async fetch() {
    await Promise.all([
      this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.CATALOG_SERVICE }),
      this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.NAMESPACE }),
      this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.SERVICE_INSTANCE })
    ]);
  },
  data() {
    return {
      sectionContent: [
        {
          isEnable:    true,
          isLoaded:    false,
          icon:        'icon-namespace',
          cta:         createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.NAMESPACE }, { query: { mode: 'openModal' } }),
          link:        createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.NAMESPACE }),
          linkText:    this.t('epinio.intro.cards.namespaces.linkText'),
          description: this.t('typeDescription.namespaces', {}, true),
          slotTitle:   this.t('epinio.intro.cards.namespaces.slotTitle')
        },
        {
          isEnable:    true,
          isLoaded:    false,
          icon:        'icon-application',
          cta:         createEpinioRoute('c-cluster-applications-createapp', { resource: EPINIO_TYPES.APP }),
          link:        createEpinioRoute('c-cluster-applications', { resource: EPINIO_TYPES.APP }),
          linkText:    this.t('epinio.intro.cards.applications.linkText'),
          description: this.t('typeDescription.applications'),
          slotTitle:   '',
        },
        {
          isEnable:    true,
          isLoaded:    false,
          icon:        'icon-service',
          cta:         createEpinioRoute('c-cluster-resource-create', { resource: EPINIO_TYPES.SERVICE_INSTANCE }),
          link:        createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.SERVICE_INSTANCE }),
          linkText:    this.t('epinio.intro.cards.services.linkText'),
          description: this.t('epinio.intro.cards.services.description'), // INFO: typeDescription to long for the dashboard card.
          slotTitle:   this.t('epinio.intro.cards.services.slotTitle')
        }],
      colorStops: {
        0: '--info', 30: '--info', 70: '--info'
      }
    };
  },
  created() {
    this.redoCards();
  },
  watch: {
    namespaces(old, neu) {
      if (isEqual(old, neu)) {
        return;
      }

      this.redoCards();
    },
    apps(old, neu) {
      if (isEqual(old, neu)) {
        return;
      }

      this.redoCards();
    },
    services(old, neu) {
      if (isEqual(old, neu)) {
        return;
      }

      this.redoCards();
    }
  },
  methods: {
    redoCards() {
      // Handles titles
      this.sectionContent[0].title = this.t('typeLabel.withCount.namespaces', { n: this.namespaces.totalNamespaces });
      this.sectionContent[1].title = this.t('typeLabel.withCount.applications', { n: this.apps?.totalApps });
      this.sectionContent[2].title = this.t('typeLabel.withCount.services', { n: this.services?.servicesInstances });

      // Handles descriptions
      if (this.namespaces?.totalNamespaces >= 0) {
        this.sectionContent[0].isLoaded = true;
      }

      if (this.apps?.totalApps >= 0) {
        this.sectionContent[1].isLoaded = true;
      }

      if (this.services?.servicesCatalog?.length >= 0) {
        this.sectionContent[2].isLoaded = true;
        this.sectionContent[2].isEnable = true;
      }
    }
  },
  computed: {
    services() {
      const fetchServicesInstances: EpinioServiceModel[] = this.$store.getters['epinio/all'](EPINIO_TYPES.SERVICE_INSTANCE);
      const fetchServices: EpinioCatalogService[] = this.$store.getters['epinio/all'](EPINIO_TYPES.CATALOG_SERVICE);

      // Try to find the desired services
      const findDesiredServices = fetchServices?.filter(service => service?.shortId === 'mysql-dev' || service?.shortId === 'redis-dev');

      //  if not found, return the first two services from the catalog
      const services: EpinioCatalogService[] | any =
      findDesiredServices.length ? findDesiredServices : fetchServices.slice(0, 2);

      const s = services.reduce((acc: any[], service: { shortId: string; }) => {
        acc.push({
          link:      createEpinioRoute('c-cluster-resource-create', { resource: EPINIO_TYPES.SERVICE_INSTANCE, name: service?.shortId }, { query: { service: service?.shortId } }),
          shortId:   service?.shortId,
          isEnabled: true
        });

        return acc;
      }, []);

      return {
        servicesInstances: fetchServicesInstances.length,
        servicesCatalog:   s,
      };
    },
    version() {
      const { displayVersion } = getVersionInfo(this.$store);

      return displayVersion;
    },
    apps() {
      const allApps = this.$store.getters['epinio/all'](EPINIO_TYPES.APP) as EpinioApplicationResource[];

      return allApps.reduce((acc, item) => {
        return {
          runningApps: acc.runningApps + (item.status === 'running' ? 1 : 0),
          stoppedApps: acc.stoppedApps + (item.status === 'error' ? 1 : 0),
          totalApps:   acc.totalApps + 1,
        };
      }, {
        runningApps: 0, stoppedApps: 0, totalApps: 0
      });
    },
    namespaces() {
      const allNamespaces: Namespace[] = this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE);

      return { totalNamespaces: allNamespaces.length, latestNamespaces: sortBy(allNamespaces, 'metadata.createdAt').reverse().slice(0, 2) };
    },
  },
});
</script>

<template>
  <div class="dashboard">
    <div class="head">
      <div class="head-title">
        <h1>{{ t('epinio.intro.welcome') }}</h1>
        <span>{{ version }}</span>
      </div>

      <p class="head-subheader">
        {{ t('epinio.intro.blurb') }}
      </p>

      <p>
        {{ t('epinio.intro.description') }}
      </p>

      <div class="head-links">
        <a
          href="https://epinio.io/"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >{{ t('epinio.intro.getStarted') }}</a>
        <a
          href="https://github.com/epinio/epinio/issues"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >{{ t('epinio.intro.issues') }}</a>
      </div>
    </div>
    <div class="get-started">
      <div
        v-for="(card, index) in sectionContent"
        :key="index"
      >
        <DashboardCard
          v-if="card.isEnable"
          :is-loaded="card.isLoaded"
          :title="card.title"
          :icon="card.icon"
          :cta="card.cta"
          :link="card.link"
          :link-text="card.linkText"
          :description="card.description"
          :slot-title="card.slotTitle"
        >
          <span v-if="index === 0 && namespaces.latestNamespaces.length > 0">
            <slot>
              <ul>
                <li
                  v-for="(ns, i) in namespaces.latestNamespaces"
                  :key="i"
                >
                  {{ ns.id }}
                </li>
              </ul>
            </slot>
          </span>

          <span v-if="index === 1 && apps.totalApps > 0">
            <slot>
              <ConsumptionGauge
                :resource-name="t('epinio.intro.cards.applications.running')"
                :capacity="apps.totalApps"
                :used-as-resource-name="true"
                :color-stops="colorStops"
                :used="apps.runningApps"
                units="Apps"
              />
            </slot>
          </span>

          <span v-if="index === 2">
            <slot>
              <ul>
                <li
                  v-for="(service, i) in services.servicesCatalog"
                  :key="i"
                >
                  <n-link
                    v-if="service.isEnabled"
                    :to="service.link"
                    class="link"
                  >
                    {{ service.shortId }}
                    <span>+</span>
                  </n-link>

                  <span
                    v-if="!service.isEnabled"
                    class="link disabled"
                  >
                    {{ service.shortId }}
                    <span>+</span>
                  </span>
                </li>
              </ul>
            </slot>
          </span>
        </DashboardCard>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;

  .head {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: $space-m;
    outline: 1px solid var(--border);
    border-radius: var(--border-radius);
    margin: 0 0 20px 0;
    padding: $space-m;
    gap: $space-m;

    &-title {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;

      h1 {
        margin: 0;
      }

      span {
        background: var(--primary);
        color: var(--default);
        border-radius: var(--border-radius);
        padding: 4px 8px;
      }
    }

    &-subheader {
      font-size: 1.2rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    &-links {
      display: flex;
      gap: 10px;
    }
  }

  .get-started {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    grid-gap: 20px;
  }
}
</style>
