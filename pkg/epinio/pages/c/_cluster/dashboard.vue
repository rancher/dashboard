<script lang="ts">
import { getVersionInfo } from '@shell/utils/version';
import Vue from 'vue';
import DashboardCard from '../../../components/dashboard/Cards.vue';
import { createEpinioRoute } from '@/pkg/epinio/utils/custom-routing';
import { EPINIO_TYPES } from '@/pkg/epinio/types';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';

export default Vue.extend<any, any, any, any>({
  components: { DashboardCard, ConsumptionGauge },

  data() {
    return {
      sectionContent: [
        {
          title:       this.t('epinio.intro.cards.namespaces.title'),
          icon:        'icon-namespace',
          cta:         createEpinioRoute('c-cluster-resource-create', { resource: EPINIO_TYPES.NAMESPACE }),
          link:        createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.NAMESPACE }),
          linkText:    this.t('epinio.intro.cards.namespaces.linkText'),
          description: this.t('epinio.intro.cards.namespaces.description'),
          slotTitle:   this.t('epinio.intro.cards.namespaces.slotTitle')
        },
        {
          title:       this.t('epinio.intro.cards.applications.title'),
          icon:        'icon-application',
          cta:         createEpinioRoute('c-cluster-applications-createapp', { resource: EPINIO_TYPES.APP }),
          link:        createEpinioRoute('c-cluster-applications', { resource: EPINIO_TYPES.APP }),
          linkText:    this.t('epinio.intro.cards.applications.linkText'),
          description: this.t('epinio.intro.cards.applications.description'),
          slotTitle:   this.t('epinio.intro.cards.applications.slotTitle')
        },
        {
          title:       this.t('epinio.intro.cards.services.title'),
          icon:        'icon-service',
          cta:         createEpinioRoute('c-cluster-resource-create', { resource: EPINIO_TYPES.SERVICE_INSTANCE }),
          link:        createEpinioRoute('c-cluster-resource', { resource: EPINIO_TYPES.SERVICE_INSTANCE }),
          linkText:    this.t('epinio.intro.cards.services.linkText'),
          description: this.t('epinio.intro.cards.services.description'),
          slotTitle:   this.t('epinio.intro.cards.services.slotTitle')
        }],
      colorStops: {
        0: '--info', 30: '--info', 70: '--info'
      }
    };
  },
  computed: {
    servicesStarter() {
      return {
        redis: createEpinioRoute('c-cluster-resource-create', { resource: EPINIO_TYPES.SERVICE_INSTANCE, name: 'redis-dev' }),
        mongo: createEpinioRoute('c-cluster-resource-create', { resource: EPINIO_TYPES.SERVICE_INSTANCE, name: 'mongo-dev' }),
      };
    },
    test() {
      return { available: 100 };
    },
    version() {
      const { displayVersion } = getVersionInfo(this.$store);

      return displayVersion;
    },
    apps() {
      const allApps = this.$store.getters['epinio/all'](EPINIO_TYPES.APP);

      const runningApps = allApps.filter((app: any) => app.status === 'running' );
      const stoppedApps: any[] = allApps.filter((app: any) => app.status === 'error' );

      return {
        runningApps: runningApps.length,
        stoppedApps: stoppedApps.length,
        totalApps:   allApps.length
      };
    },
    namespaces() {
      const allNamespaces = this.$store.getters['epinio/all'](EPINIO_TYPES.NAMESPACE);

      let totalApps = 0;
      let totalConfigurations = 0;

      return allNamespaces.reduce((acc: any, namespace: any) => {
        acc[namespace.name] = {
          apps:           namespace.apps?.length,
          configurations: namespace.configurations?.length
        };

        totalApps += namespace.apps?.length;
        totalConfigurations += namespace.configurations?.length;

        return {
          ...acc, totalApps, totalConfigurations
        };
      }, {});
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
        >Get Started</a>
        <a
          href="https://github.com/epinio/epinio/issues"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >Issues</a>
      </div>
    </div>
    <div class="get-started">
      <div
        v-for="(items, index) in sectionContent"
        :key="index"
      >
        <DashboardCard
          :title="items.title"
          :icon="items.icon"
          :cta="items.cta"
          :link="items.link"
          :link-text="items.linkText"
          :description="items.description"
          :slot-title="items.slotTitle"
        >
          <span v-if="index === 0">
            <slot>
              <ul>
                <li>
                  Applications
                  <span>{{ namespaces.totalApps }}</span>
                </li>
                <li>
                  Configurations
                  <span>{{ namespaces.totalConfigurations }}</span>
                </li>
              </ul>
            </slot>
          </span>

          <span v-if="index === 1">
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
                <li>
                  <n-link
                    :to="servicesStarter.mongo"
                    class="link"
                  >
                    mongodb-dev
                    <span>+</span>
                  </n-link>
                </li>
                <li>
                  <n-link
                    :to="servicesStarter.redis"
                    class="link"
                  >
                    redis-dev
                    <span>+</span>
                  </n-link>
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
    margin: 0 0 64px 0;
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
