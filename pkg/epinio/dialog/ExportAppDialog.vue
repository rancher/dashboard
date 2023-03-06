<script>
import GenericPrompt from '@shell/dialog/GenericPrompt';
import Banner from '@components/Banner/Banner.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';

export default {
  name:       'ExportAppDialog',
  components: {
    GenericPrompt, Banner, Tabbed, Tab, AsyncButton
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      appPartsData: this.resources[0]?.applicationParts.reduce((accumulator, currentValue) => {
        accumulator[currentValue] = {};

        return accumulator;
      }, {}),
      appParts: this.resources[0]?.applicationParts
    };
  },

  methods: {
    async downloadChart(buttonCb) {
      if (!this._isBeingDestroyed || !this._isDestroyed) {
        await Promise.all(this.appParts.map(async(part) => {
          const data = await this.resources[0].fetchPart(part);

          this.appPartsData[part] = data;
        }));

        await this.resources[0].chartZip(this.appPartsData);
      }

      buttonCb(true);
    },

    async downloadManifest(buttonCb) {
      if (!this._isBeingDestroyed || !this._isDestroyed) {
        await this.resources[0].createManifest();
      }

      buttonCb(true);
    },
  }
};
</script>

<template>
  <GenericPrompt
    :resources="resources"
    @close="$emit('close')"
  >
    <template
      slot="title"
    />
    <template slot="body">
      <Tabbed>
        <Tab
          label-key="epinio.applications.export.manifest.title"
          name="manifest"
          :weight="3"
        >
          <p>
            {{ t('epinio.applications.export.manifest.description') }}
          </p>

          <AsyncButton
            class="mt-20"
            mode="download"
            @click="downloadManifest"
          />
        </Tab>

        <Tab
          label-key="epinio.applications.export.chart.title"
          name="chart"
          :weight="2"
        >
          <p>
            {{ t('epinio.applications.export.chart.description') }}
          </p>
          <Banner
            color="info"
          >
            {{ t('epinio.applications.export.chart.banner') }}
          </Banner>

          <AsyncButton
            class="mt-20"
            mode="download"
            @click="downloadChart"
          />
        </Tab>
      </Tabbed>
    </template>
  </genericprompt>
</template>
  </GenericPrompt>
</template>
