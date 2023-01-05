<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../models/applications';
import SimpleBox from '@shell/components/SimpleBox.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '../types';
import ResourceTable from '@shell/components/ResourceTable.vue';
import PlusMinus from '@shell/components/form/PlusMinus.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';
import ApplicationCard from '@shell/components/cards/ApplicationCard.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    SimpleBox,
    ConsumptionGauge,
    ResourceTable,
    PlusMinus,
    ApplicationCard,
    Tabbed,
    Tab,
  },
  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
  fetch() {
    this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.SERVICE_INSTANCE });
    this.$store.dispatch(`epinio/findAll`, { type: EPINIO_TYPES.CONFIGURATION });
  },

  data() {
    const appInstanceSchema = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.APP_INSTANCE);
    const servicesSchema = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.SERVICE_INSTANCE);
    const servicesHeaders: [] = this.$store.getters['type-map/headersFor'](servicesSchema);
    const configsSchema = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.CONFIGURATION);
    const configsHeaders: [] = this.$store.getters['type-map/headersFor'](configsSchema);

    return {
      saving:      false,
      appInstance: {
        schema:  appInstanceSchema,
        headers: this.$store.getters['type-map/headersFor'](appInstanceSchema),
      },
      services: {
        schema:  servicesSchema,
        headers: servicesHeaders.filter((h: any) => !['namespace', 'boundApps'].includes(h.name)),
      },
      configs: {
        schema:  configsSchema,
        headers: configsHeaders.filter((h: any) => !['namespace', 'boundApps', 'service'].includes(h.name)),
      }
    };
  },

  methods: {
    async updateInstances(newInstances: number) {
      this.$set(this, 'saving', true);
      try {
        this.value.configuration.instances = newInstances;
        await this.value.update();
        await this.value.forceFetch();
      } catch (err) {
        console.error(`Failed to scale Application: `, epinioExceptionToErrorsArray(err)); // eslint-disable-line no-console
      }
      this.$set(this, 'saving', false);
    },
    formatURL(str: string) {
      const matchGithub = str.match('^(https|git)(:\/\/|@)([^\/:]+)[\/:]([^\/:]+)\/(.+)(.git)*$');

      return `${ matchGithub?.[4] }/${ matchGithub?.[5] }`;
    }
  },

  computed: {
    sourceIcon(): string {
      return this.value.sourceInfo?.icon || 'icon-epinio';
    }
  }
});
</script>

<template>
  <div>
    <div class="application-details">
      <ApplicationCard>
        <!-- Icon slot -->
        <template v-slot:cardIcon>
          <i
            class="icon icon-fw"
            :class="sourceIcon"
          />
        </template>

        <!-- Routes links slot -->
        <template v-slot:top-left>
          <h1>Routes</h1>
          <ul>
            <li
              v-for="route in value.configuration.routes"
              :key="route.id"
            >
              <a
                v-if="value.state === 'running'"
                :key="route.id + 'a'"
                :href="`https://${route}`"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >{{ `https://${route}` }}</a>
              <span
                v-else
                :key="route.id + 'b'"
              >{{ `https://${route}` }}</span>
            </li>
          </ul>
        </template>

        <!-- <template v-slot:top-right>
        </template> -->

        <!-- Resources count slot -->
        <template v-slot:resourcesCount>
          <div>
            {{ value.envCount }} {{ t('epinio.applications.detail.counts.envVars') }}
          </div>
          <div>
            {{ value.serviceConfigurations.length }} {{ t('epinio.applications.detail.counts.services') }}
          </div>
          <div>
            {{ value.baseConfigurations.length }} {{ t('epinio.applications.detail.counts.config') }}
          </div>
        </template>
      </ApplicationCard>
    </div>

    <h3
      v-if="value.deployment"
      class="mt-20"
    >
      {{ t('epinio.applications.detail.deployment.label') }}
    </h3>

    <div
      v-if="value.deployment"
      class="deployment"
    >
      <div class="simple-box-row app-instances">
        <SimpleBox>
          <ConsumptionGauge
            :resource-name="t('epinio.applications.detail.deployment.instances')"
            :capacity="value.desiredInstances"
            :used="value.readyInstances"
            :used-as-resource-name="true"
            :color-stops="{ 70: '--success', 30: '--warning', 0: '--error' }"
          />
          <div class="scale-instances">
            <PlusMinus
              class="mt-15 mb-10"
              :value="value.desiredInstances"
              :disabled="saving"
              @minus="updateInstances(value.desiredInstances - 1)"
              @plus="updateInstances(value.desiredInstances + 1)"
            />
          </div>
        </SimpleBox>
        <!-- Source information -->
        <SimpleBox v-if="value.sourceInfo">
          <div class="deployment__origin__row">
            <h4>Deployment Details</h4>
          </div>
          <div class="deployment__origin__list">
            <ul>
              <li>
                <h4>Origin</h4>
                <span v-if="value.sourceInfo.label === 'Git'">
                  <i class="icon icon-fw icon-github" />
                  {{ value.sourceInfo.label }}
                </span>
                <span v-else>{{ value.sourceInfo.label }}</span>
              </li>

              <li
                v-for="d of value.sourceInfo.details"
                :key="d.label"
              >
                <h4>{{ d.label }}</h4>
                <span v-if="d.value && d.value.startsWith('http')">
                  <a
                    :href="d.value"
                    target="_blank"
                  >{{ formatURL(d.value) }}</a>
                </span>
                <span v-else>{{ d.value }}</span>
              </li>

              <li>
                <h4>{{ t('epinio.applications.tableHeaders.deployedBy') }}</h4>
                <span> {{ value.deployment.username }}</span>
              </li>
            </ul>
          </div>
        </SimpleBox>
        <SimpleBox>
          <div class="deployment__origin__row">
            <h4>Application Metrics</h4>
            <table class="stats mt-15">
              <thead>
                <tr>
                  <th />
                  <th>Min</th>
                  <th>Max</th>
                  <th>Avg</th>
                </tr>
              </thead>
              <tr>
                <td>{{ t('tableHeaders.memory') }}</td>
                <td>{{ value.instanceMemory.min }}</td>
                <td>{{ value.instanceMemory.max }}</td>
                <td>{{ value.instanceMemory.avg }}</td>
              </tr>
              <tr>
                <td>{{ t('tableHeaders.cpu') }}</td>
                <td>{{ value.instanceCpu.min }}</td>
                <td>{{ value.instanceCpu.max }}</td>
                <td>{{ value.instanceCpu.avg }}</td>
              </tr>
            </table>
          </div>
        </SimpleBox>
      </div>
    </div>

    <h3 class="mt-20">
      {{ t('epinio.applications.detail.tables.label') }}
    </h3>

    <div>
      <Tabbed>
        <Tab
          label-key="epinio.applications.detail.tables.instances"
          name="instances"
          :weight="3"
        >
          <ResourceTable
            :schema="appInstance.schema"
            :headers="appInstance.headers"
            :rows="value.instances"
            :table-actions="false"
          />
        </Tab>
        <Tab
          label-key="epinio.applications.detail.tables.services"
          name="services"
          :weight="2"
        >
          <ResourceTable
            :schema="services.schema"
            :headers="services.headers"
            :rows="value.services"
            :namespaced="false"
            :table-actions="false"
          />
        </Tab>
        <Tab
          label-key="epinio.applications.detail.tables.configs"
          name="configs"
          :weight="1"
        >
          <ResourceTable
            :schema="configs.schema"
            :headers="configs.headers"
            :rows="value.baseConfigurations"
            :namespaced="false"
            :table-actions="false"
          />
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.simple-box-row {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  grid-gap: 10px;

  @media only screen and (max-width: map-get($breakpoints, '--viewport-9')) {
    grid-auto-flow: row;
  }
  .simple-box {
    width: 100%;
    ul {
      word-break: break-all;
      padding-left: 20px;
    }
    &:not(:last-of-type) {
      margin-right: 20px;
    }
    .deployment__origin__row {
      display: flex;
      flex-direction: column;
      h4:first-of-type {
        font-weight: bold;
        margin-bottom: 0;
      }
      h4:last-of-type {
        word-break: break-all;
      }
      &:last-of-type {
        h4:last-of-type {
          margin-bottom: 0;
        }
      }
      thead {
        tr {
          th {
            text-align: left;
            color: #c4c4c4;
            font-weight: 300;
          }
        }
      }
    }
    .deployment__origin__list {
      ul {
        margin: 20px 0;
        padding: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;

        li {
          margin: 5px;
          list-style: none;
          h4 {
            color: #c4c4c4;
            font-weight: 300;
            margin: 0;
          }
        }
      }
    }
  }
  .box {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    & h1,
    h3 {
      margin-left: 5;
    }
    h3 {
      flex: 1;
      display: flex;
    }
    &-two-cols {
      display: flex;
      h1 {
        font-size: 4.5rem;
        padding: 0 10px;
      }
      div {
        margin-top: 8px;
      }
    }
    &-timers {
      display: flex;
      flex-direction: column;
      h4 {
        font-size: 1.6rem;
      }
      div {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }
    }
  }
}

.deployment {
  .simple-box {
    width: 100%;
    margin-bottom: 0;
  }
  .app-instances {
    tr td {
      min-width: 58px;
      padding: 5px 0;
      font-size: 1.1rem;
    }
    .scale-instances {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
