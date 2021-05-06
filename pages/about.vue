<script>
import Loading from '@/components/Loading';
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
import { getProduct } from '@/config/private-label';
import { downloadFile } from '@/utils/download';

export default {
  components: { Loading },
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
      return getProduct();
    },
    uiVersion() {
      return `${ process.env.version }${ process.env.commit ? `-${ process.env.commit }` : '' }`;
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
      <tr v-if="uiVersion">
        <td>
          <a href="https://github.com/rancher/dashboard" target="_blank" rel="nofollow noopener noreferrer">
            {{ t("about.versions.ui") }}
          </a>
        </td><td>{{ uiVersion }}</td>
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
    <p class="pt-20 pb-40" v-html="t('about.versions.releaseNotes', {}, true)" />
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
    td {
      min-width: 150px;
      padding: 8px 5px;
    }
    a {
      cursor: pointer;
    }
  }

  table {
    border-collapse: collapse;
    overflow: hidden;
    border-radius: var(--border-radius);

    > thead > tr > th {
      padding: 8px 5px;
      background-color: var(--sortable-table-body-divider);
    }
  }

  th, td {
    border: 1px solid var(--border);
    text-align: left;
    }
  th {
      border-bottom: 1px solid var(--sortable-table-top-divider);
      background-color: var(--body-bg);
  }
  tr:nth-child(odd) {
      background-color: var(--sortable-table-accent-bg);
  }
</style>
