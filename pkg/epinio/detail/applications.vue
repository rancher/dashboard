<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '../models/applications';
import SimpleBox from '@shell/components/SimpleBox.vue';
import ConsumptionGauge from '@shell/components/ConsumptionGauge.vue';
import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '../types';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import PlusMinus from '@shell/components/form/PlusMinus.vue';
import { epinioExceptionToErrorsArray } from '../utils/errors';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    SimpleBox, ConsumptionGauge, ResourceTable, Tabbed, Tab, PlusMinus
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

  data() {
    return {
      appInstanceSchema: this.$store.getters[`${ EPINIO_PRODUCT_NAME }/schemaFor`](EPINIO_TYPES.APP_INSTANCE),
      saving:            false,
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
    }
  },

  computed: {}

});
</script>

<template>
  <div>
    <div class="simple-box-row mt-40">
      <SimpleBox class="routes">
        <div class="box">
          <h1>{{ value.routeCount }}</h1>
          <h3>
            {{ t('epinio.applications.detail.counts.routes') }}
          </h3>
        </div>
        <ul>
          <li v-for="(route) in value.configuration.routes" :key="route.id">
            <a v-if="value.state === 'running'" :key="route.id + 'a'" :href="`https://${route}`" target="_blank" rel="noopener noreferrer nofollow">{{ `https://${route}` }}</a>
            <span v-else :key="route.id + 'a'">{{ `https://${route}` }}</span>
          </li>
        </ul>
      </SimpleBox>
      <SimpleBox class="services">
        <div class="box">
          <h1>{{ value.configCount }}</h1>
          <h3>
            {{ t('epinio.applications.detail.counts.config') }}
          </h3>
        </div>
      </SimpleBox>
      <SimpleBox class="envs">
        <div class="box">
          <h1>{{ value.envCount }}</h1>
          <h3>
            {{ t('epinio.applications.detail.counts.envVars') }}
          </h3>
        </div>
      </SimpleBox>
    </div>
    <h3 v-if="value.deployment" class="mt-20">
      {{ t('epinio.applications.detail.deployment.label') }}
    </h3>

    <Tabbed v-if="value.deployment" class="deployment" default-tab="summary">
      <Tab label-key="epinio.applications.detail.deployment.summary" name="summary" :weight="1">
        <div class="simple-box-row app-instances">
          <SimpleBox>
            <ConsumptionGauge
              :resource-name="t('epinio.applications.detail.deployment.instances')"
              :capacity="value.desiredInstances"
              :used="value.readyInstances"
              :used-as-resource-name="true"
              :color-stops="{ 70: '--success', 30: '--warning', 0: '--error' }"
            >
            </ConsumptionGauge>
            <div class="scale-instances">
              <PlusMinus class="mt-15 mb-10" :value="value.desiredInstances" :disabled="saving" @minus="updateInstances(value.desiredInstances-1)" @plus="updateInstances(value.desiredInstances+1)" />
            </div>
            <table class="stats">
              <thead>
                <tr>
                  <th></th>
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
          </SimpleBox>
          <SimpleBox v-if="value.sourceInfo">
            <div class="deployment__origin__row">
              <h4>Origin</h4><h4>
                {{ value.sourceInfo.label }}
              </h4>
            </div>
            <div v-for="d of value.sourceInfo.details" :key="d.label" class="deployment__origin__row">
              <h4>{{ d.label }}</h4><h4>{{ d.value }}</h4>
            </div>
          </SimpleBox>
          <SimpleBox v-if="value.deployment.username">
            <div class="deployment__origin__row">
              <h4>{{ t('epinio.applications.tableHeaders.deployedBy') }}</h4><h4>
                {{ value.deployment.username }}
              </h4>
            </div>
          </SimpleBox>
        </div>
      </Tab>
      <Tab label-key="epinio.applications.detail.deployment.instances" name="instances">
        <ResourceTable :schema="appInstanceSchema" :rows="value.instances" :table-actions="false" />
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang='scss' scoped>
.simple-box-row {
  display: flex;
  flex-wrap: wrap;

  .simple-box {
    width: 300px;
    max-width: 350px;
    margin-bottom: 20px;

    &.routes {
      width: 310px;
      max-width: 360px;
    }

    &.services,&.envs {
      width: 290px;
      max-width: 340px;
    }

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
    }
  }
  .box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    & H1, H3 {
      margin: 0;
    }

    H3 {
      flex: 1;
      display: flex;
      justify-content: center;
    }
  }
}

.deployment {
  max-width: 955px;
  .simple-box {
    margin-bottom: 0;
    width: 290px;
    max-width: 340px;
  }

  .app-instances {
    tr td {
      min-width:58px;
    }

    .scale-instances {
      display: flex;
      justify-content: center;
    }
  }

}

</style>
