<script>
import Loading from '@/components/Loading';
import BackLink from '@/components/BackLink';
import BackRoute from '@/mixins/back-link';
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
import { getVendor } from '@/config/private-label';
import { downloadFile } from '@/utils/download';

export default {
  layout:     'plain',
  components: { BackLink, Loading },
  mixins:     [BackRoute],
  async fetch() {
    this.settings = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
  },
  data() {
    return {
      settings: null,
      SETTING
    };
  },
  computed:   {
    rancherVersion() {
      return this.settings.find(s => s.id === SETTING.VERSION_RANCHER);
    },
    appName() {
      return getVendor();
    },
    cliVersion() {
      return this.settings.find(s => s.id === SETTING.VERSION_CLI);
    },
    helmVersion() {
      return this.settings.find(s => s.id === SETTING.VERSION_HELM);
    },
    dockerMachineVersion() {
      return this.settings.find(s => s.id === SETTING.VERSION_MACHINE);
    },
  },
  methods: {
    async downloadLinuxImages() {
      const res = await this.$store.dispatch('management/request', { url: '/v3/kontainerdrivers/rancher-images' });

      try {
        await downloadFile(`.rancher-linux-images.txt`, res.data);
      } catch (error) {
        this.$store.dispatch('growl/fromError', { title: 'Error downloading Linux image list', err: error }, { root: true });
      }
    },

    async downloadWindowsImages() {
      const res = await this.$store.dispatch('management/request', { url: '/v3/kontainerdrivers/rancher-windows-images' });

      try {
        await downloadFile(`.rancher-windows-images.txt`, res.data);
      } catch (error) {
        this.$store.dispatch('growl/fromError', { title: 'Error downloading Windows image list', err: error }, { root: true });
      }
    },
  }
};
</script>

<template>
  <Loading v-if="!settings" />
  <div v-else class="about">
    <BackLink :link="backLink" />
    <h1 v-t="'about.title'" />
    <h3>{{ t('about.versions.title') }}</h3>
    <table class="">
      <thead>
        <tr>
          <th>{{ t('about.versions.component') }}</th>
          <th>{{ t('about.versions.version') }}</th>
        </tr>
      </thead>
      <tr v-if="rancherVersion">
        <td>
          <a href="https://github.com/rancher/rancher" target="_blank" rel="nofollow noopener noreferrer">
            {{ appName }}
          </a>
        </td><td>{{ rancherVersion.value }}</td>
      </tr>
      <tr v-if="cliVersion">
        <td>
          <a href="https://github.com/rancher/cli" target="_blank" rel="nofollow noopener noreferrer">
            {{ appName }} {{ t("about.versions.cli") }}
          </a>
        </td><td>{{ cliVersion.value }}</td>
      </tr>
      <tr v-if="helmVersion">
        <td>
          <a href="https://github.com/rancher/helm" target="_blank" rel="nofollow noopener noreferrer">
            {{ t("about.versions.helm") }}
          </a>
        </td><td>{{ helmVersion.value }}</td>
      </tr>
      <tr v-if="dockerMachineVersion">
        <td>
          <a href="https://github.com/rancher/machine" target="_blank" rel="nofollow noopener noreferrer">
            {{ t("about.versions.machine") }}
          </a>
        </td><td>{{ dockerMachineVersion.value }}</td>
      </tr>
    </table>
    <p class="pt-20 pb-40">
      <nuxt-link :to="{ path: 'docs/release-notes'}">
        {{ t('about.versions.releaseNotes') }}
      </nuxt-link>
    </p>
    <h3>{{ t('about.imageList.title') }}</h3>
    <table>
      <tr>
        <td>
          {{ t("about.imageList.linuxImageList") }}
        </td><td>
          <a @click="downloadLinuxImages">
            {{ t('asyncButton.download.action') }}
          </a>
        </td>
      </tr>
      <tr>
        <td>
          {{ t("about.imageList.windowsImageList") }}
        </td><td>
          <a @click="downloadWindowsImages">
            {{ t('asyncButton.download.action') }}
          </a>
        </td>
      </tr>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.about {
  table {
    border-collapse: collapse;
    overflow: hidden;
    border-radius: var(--border-radius);

    tr > td:first-of-type {
      width: 20%;
    }

    th, td {
      border: 1px solid var(--border);
      padding: 8px 5px;
      min-width: 150px;
      text-align: left;
    }

    th {
      background-color: var(--sortable-table-top-divider);
      border-bottom: 1px solid var(--sortable-table-top-divider);
    }

    a {
      cursor: pointer;
    }
  }
}

</style>
