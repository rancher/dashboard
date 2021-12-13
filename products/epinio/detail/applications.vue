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
    initialValue: {
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
    <div class="simple-box-row">
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
    <div v-if="value.deployment" class="simple-box-row">
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
      <SimpleBox v-if="value.sourceInfo" class="">
        <div class="deployment__origin__row">
          <h4>Origin:</h4><h4>
            {{ value.sourceInfo.label }}
          </h4>
        </div>
        <div v-for="d of value.sourceInfo.details" :key="d.label" class="deployment__origin__row">
          <h4>{{ d.label }}:</h4><h4>
            {{ d.value }}
          </h4>
        </div>
      </SimpleBox>
    </div>
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
    &:not(:last-of-type) {
      margin-right: 20px;
    }

    .deployment__origin__row {
      display: flex;
      justify-content: space-between;
      h4:nth-of-type(2) {
        text-align: right;
        word-break: break-all;
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

</style>
