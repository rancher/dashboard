<script lang="ts">
import Vue, { PropType } from 'vue';
import Application from '@/products/epinio/models/applications';
import SimpleBox from '@/components/SimpleBox.vue';
import ConsumptionGauge from '@/components/ConsumptionGauge.vue';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: { SimpleBox, ConsumptionGauge },

  props: {
    value: {
      type:     Object as PropType<Application>,
      required: true
    },
    originalValue: {
      type:     Object as PropType<Application>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
});
</script>

<template>
  <div>
    <h3 class="mt-20">
      {{ t('epinio.applications.detail.counts.label') }}
    </h3>
    <div class="resource-gauges">
      <SimpleBox>
        <div class="box">
          <h1>{{ value.serviceCount }}</h1>
          <h3>
            {{ t('epinio.applications.detail.counts.service') }}
          </h3>
        </div>
      </SimpleBox>
      <SimpleBox>
        <div class="box">
          <h1>{{ value.routeCount }}</h1>
          <h3>
            {{ t('epinio.applications.detail.counts.routes') }}
          </h3>
        </div>
      </SimpleBox>
      <SimpleBox>
        <div class="box">
          <h1>{{ value.envCount }}</h1>
          <h3>
            {{ t('epinio.applications.detail.counts.envVars') }}
          </h3>
        </div>
      </SimpleBox>
    </div>
    <h3 v-if="value.configuration.routes.length" class="mt-40">
      {{ t('epinio.applications.detail.routes.label') }}
    </h3>
    <div>
      <ul>
        <li v-for="(route) in value.configuration.routes" :key="route.id">
          <a v-if="value.state === 'running'" :key="route.id + 'a'" :href="`https://${route}`" target="_blank" rel="noopener noreferrer nofollow">{{ `https://${route}` }}</a>
          <span v-else :key="route.id + 'a'">{{ `https://${route}` }}</span>
        </li>
      </ul>
    </div>
    <h3 v-if="value.deployment" class="mt-40">
      {{ t('epinio.applications.detail.deployment.label') }}
    </h3>
    <div v-if="value.deployment" class="resource-gauges">
      <SimpleBox>
        <ConsumptionGauge
          :resource-name="t('epinio.applications.detail.deployment.instances')"
          :capacity="value.desiredInstances"
          :used="value.readyInstances"
          :used-as-resource-name="true"
          :color-stops="{ 70: '--success', 30: '--warning', 0: '--error' }"
        >
        </ConsumptionGauge>
      </SimpleBox>
      <SimpleBox>
        <div class="box">
          <h1>{{ value.memory }}</h1>
          <h3>
            {{ t('epinio.applications.detail.deployment.memory') }}
          </h3>
        </div>
      </SimpleBox>
      <SimpleBox>
        <div class="box">
          <h1>{{ value.cpu }}</h1>
          <h3>
            {{ t('epinio.applications.detail.deployment.cpu') }}
          </h3>
        </div>
      </SimpleBox>
    </div>
  </div>
</template>
<style lang='scss' scoped>
.resource-gauges {
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

</style>
