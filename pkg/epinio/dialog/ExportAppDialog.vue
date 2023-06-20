<script>
import GenericPrompt from '@shell/dialog/GenericPrompt';
import Banner from '@components/Banner/Banner.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { APPLICATION_PARTS } from '../types';
import JSZip from 'jszip';
import { downloadFile } from '@shell/utils/download';

export default {
  name:       'ExportAppDialog',
  components: {
    GenericPrompt, Banner, Tabbed, Tab
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },
  data() {
    return {
      config: {
        title:       this.t('promptRemove.title'),
        applyMode:   'export',
        applyAction: this.exportApplicationManifest,
      }
    };
  },

  methods: {
    async exportApplicationManifest() {
      const resource = this.resources[0];

      const chartZip = async(files) => {
        const zip = new JSZip();

        for (const fileName in files) {
          const extension = {
            [APPLICATION_PARTS.VALUES]: 'yaml',
            [APPLICATION_PARTS.CHART]:  'tar.gz',
            [APPLICATION_PARTS.IMAGE]:  'tar',
          };

          zip.file(`${ fileName }.${ extension[fileName] }`, files[fileName]);
        }

        const contents = await zip.generateAsync({ type: 'blob' });

        await downloadFile(`${ resource.meta.name }-helm-chart.zip`, contents, 'application/zip');
      };

      if (this.$route.hash === '#manifest') {
        await resource.createManifest();
      } else {
        const partsData = await resource?.applicationParts
          .filter(part => part !== APPLICATION_PARTS.MANIFEST)
          .reduce(async(acc, part) => ({
            ...await acc,
            [part]: await resource.fetchPart(part),
          }), Promise.resolve({}));

        await chartZip(partsData);
      }
    }
  }
};
</script>

<template>
  <GenericPrompt
    v-bind="config"
    @close="$emit('close')"
  >
    <h4
      slot="title"
      class="text-default-text export-app-dialog__title"
    >
      {{ t('epinio.applications.export.label') }}
    </h4>

    <template slot="body">
      <Tabbed>
        <Tab
          label-key="epinio.applications.export.manifest.title"
          name="manifest"
          :weight="3"
          class="export-app-dialog__tab"
        >
          <p>
            {{ t('epinio.applications.export.manifest.description') }}
          </p>
        </Tab>

        <Tab
          label-key="epinio.applications.export.chart.title"
          name="chart"
          :weight="2"
          class="export-app-dialog__tab"
        >
          <p>
            {{ t('epinio.applications.export.chart.description') }}
          </p>
          <Banner
            color="info"
          >
            {{ t('epinio.applications.export.chart.banner') }}
          </Banner>
        </Tab>
      </Tabbed>
    </template>
  </GenericPrompt>
</template>
<style lang='scss' scoped>
.export-app-dialog {
  &__title {
    margin-bottom: 0;
  }
  &__tab {
    min-height: 110px;
  }
}
</style>
