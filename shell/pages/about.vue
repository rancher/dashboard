<script>
import Loading from '@shell/components/Loading';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getVendor } from '@shell/config/private-label';
import { downloadFile } from '@shell/utils/download';

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
  computed: {
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
    downloads() {
      return [
        this.createOSOption('about.os.mac', 'icon-apple', this.settings?.find(s => s.id === SETTING.CLI_URL.DARWIN)?.value, null),
        this.createOSOption('about.os.linux', 'icon-linux', this.settings?.find(s => s.id === SETTING.CLI_URL.LINUX)?.value, this.downloadLinuxImages),
        this.createOSOption('about.os.windows', 'icon-windows', this.settings?.find(s => s.id === SETTING.CLI_URL.WINDOWS)?.value, this.downloadWindowsImages)
      ];
    },
    downloadImageList() {
      return this.downloads.filter(d => !!d.imageList);
    },
    downloadCli() {
      return this.downloads.filter(d => !!d.cliLink);
    }
  },
  methods: {
    createOSOption(label, icon, cliLink, imageList) {
      const slash = cliLink?.lastIndexOf('/');

      return {
        label,
        icon,
        imageList,
        cliLink,
        cliFile: slash >= 0 ? cliLink.substr(slash + 1, cliLink.length - 1) : cliLink
      };
    },

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
  <div
    v-else
    class="about"
  >
    <BackLink :link="backLink" />
    <div class="title-block mt-20 mb-40">
      <h1 v-t="'about.title'" />
      <n-link
        :to="{ name: 'diagnostic' }"
        class="btn role-primary"
      >
        {{ t('about.diagnostic.title') }}
      </n-link>
    </div>
    <h3>{{ t('about.versions.title') }}</h3>
    <table>
      <thead>
        <tr>
          <th>{{ t('about.versions.component') }}</th>
          <th>{{ t('about.versions.version') }}</th>
        </tr>
      </thead>
      <tr v-if="rancherVersion">
        <td>
          <a
            href="https://github.com/rancher/rancher"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            {{ appName }}
          </a>
        </td><td>{{ rancherVersion.value }}</td>
      </tr>
      <tr v-if="cliVersion">
        <td>
          <a
            href="https://github.com/rancher/cli"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            {{ appName }} {{ t("about.versions.cli") }}
          </a>
        </td><td>{{ cliVersion.value }}</td>
      </tr>
      <tr v-if="helmVersion">
        <td>
          <a
            href="https://github.com/rancher/helm"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            {{ t("about.versions.helm") }}
          </a>
        </td><td>{{ helmVersion.value }}</td>
      </tr>
      <tr v-if="dockerMachineVersion">
        <td>
          <a
            href="https://github.com/rancher/machine"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            {{ t("about.versions.machine") }}
          </a>
        </td><td>{{ dockerMachineVersion.value }}</td>
      </tr>
    </table>
    <p class="pt-20">
      <nuxt-link :to="{ path: 'docs/whats-new'}">
        {{ t('about.versions.releaseNotes') }}
      </nuxt-link>
    </p>
    <template v-if="downloadImageList.length">
      <h3 class="pt-40">
        {{ t('about.downloadImageList.title') }}
      </h3>
      <table>
        <tr
          v-for="d in downloadImageList"
          :key="d.icon"
        >
          <td>
            <div class="os">
              <i :class="`icon ${d.icon} mr-5`" /> {{ t(d.label) }}
            </div>
          </td>
          <td>
            <a
              v-if="d.imageList"
              @click="d.imageList"
            >
              {{ t('asyncButton.download.action') }}
            </a>
          </td>
        </tr>
      </table>
    </template>
    <template v-if="downloadCli.length">
      <h3 class="pt-40">
        {{ t('about.downloadCLI.title') }}
      </h3>
      <table>
        <tr
          v-for="d in downloadCli"
          :key="d.icon"
          class="link"
        >
          <td>
            <div class="os">
              <i :class="`icon ${d.icon} mr-5`" /> {{ t(d.label) }}
            </div>
          </td>
          <td>
            <a
              v-if="d.cliLink"
              :href="d.cliLink"
            >{{ d.cliFile }}</a>
          </td>
        </tr>
      </table>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.about {
  .title-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

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

    .os {
      display: flex;
      align-items: center;
    }
  }
}

</style>
