<script>
import Loading from '@shell/components/Loading';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getVendor } from '@shell/config/private-label';
import { downloadFile } from '@shell/utils/download';
import { mapGetters } from 'vuex';
import TabTitle from '@shell/components/TabTitle';

export default {
  components: {
    BackLink, Loading, TabTitle
  },
  mixins: [BackRoute],
  async fetch() {
    this.settings = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
  },
  data() {
    return {
      dashboardVersion: this.$config.dashboardVersion,
      settings:         null,
      SETTING
    };
  },
  computed: {
    ...mapGetters(['releaseNotesUrl']),
    rancherVersion() {
      return this.settings.find((s) => s.id === SETTING.VERSION_RANCHER);
    },
    appName() {
      return getVendor();
    },
    cliVersion() {
      return this.settings.find((s) => s.id === SETTING.VERSION_CLI);
    },
    helmVersion() {
      return this.settings.find((s) => s.id === SETTING.VERSION_HELM);
    },
    dockerMachineVersion() {
      return this.settings.find((s) => s.id === SETTING.VERSION_MACHINE);
    },
    downloads() {
      return [
        this.createOSOption('about.os.mac', 'icon-apple', this.settings?.find((s) => s.id === SETTING.CLI_URL.DARWIN)?.value, null),
        this.createOSOption('about.os.linux', 'icon-linux', this.settings?.find((s) => s.id === SETTING.CLI_URL.LINUX)?.value, this.downloadLinuxImages),
        this.createOSOption('about.os.windows', 'icon-windows', this.settings?.find((s) => s.id === SETTING.CLI_URL.WINDOWS)?.value, this.downloadWindowsImages)
      ];
    },
    downloadImageList() {
      return this.downloads.filter((d) => !!d.imageList);
    },
    downloadCli() {
      return this.downloads.filter((d) => !!d.cliLink);
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
      <h1>
        <TabTitle breadcrumb="vendor-only">
          {{ t('about.title') }}
        </TabTitle>
      </h1>
      <router-link
        :to="{ name: 'diagnostic' }"
        class="btn role-primary"
        data-testid="about__diagnostics_button"
        role="button"
        :aria-label="t('about.diagnostic.title')"
        @keyup.space="$router.push({ name: 'diagnostic' })"
      >
        {{ t('about.diagnostic.title') }}
      </router-link>
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
            role="link"
            :aria-label="t('about.versions.githubRepo', {name: t(`about.versions.rancher`) })"
          >
            {{ t("about.versions.rancher") }}
          </a>
        </td><td>{{ rancherVersion.value }}</td>
      </tr>
      <tr v-if="dashboardVersion">
        <td>
          <a
            href="https://github.com/rancher/dashboard"
            target="_blank"
            rel="nofollow noopener noreferrer"
            role="link"
            :aria-label="t('about.versions.githubRepo', {name: t(`generic.dashboard`)})"
          >
            {{ t("generic.dashboard") }}
          </a>
        </td><td>{{ dashboardVersion }}</td>
      </tr>
      <tr v-if="cliVersion">
        <td>
          <a
            href="https://github.com/rancher/cli"
            target="_blank"
            rel="nofollow noopener noreferrer"
            role="link"
            :aria-label="t('about.versions.githubRepo', {name: t(`about.versions.cli`) })"
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
            role="link"
            :aria-label="t('about.versions.githubRepo', {name: t(`about.versions.helm`) })"
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
            role="link"
            :aria-label="t('about.versions.githubRepo', {name: t(`about.versions.machine`) })"
          >
            {{ t("about.versions.machine") }}
          </a>
        </td><td>{{ dockerMachineVersion.value }}</td>
      </tr>
    </table>
    <p class="pt-20">
      <a
        class="release-notes-link"
        :href="releaseNotesUrl"
        target="_blank"
        rel="nofollow noopener noreferrer"
        role="link"
        :aria-label="t('about.versions.releaseNotes')"
      >
        {{ t('about.versions.releaseNotes') }}
      </a>
    </p>
    <template v-if="downloadImageList.length">
      <h3 class="pt-40">
        {{ t('about.downloadImageList.title') }}
      </h3>
      <table>
        <tr
          v-for="(d, i) in downloadImageList"
          :key="i"
        >
          <td>
            <div class="os">
              <i :class="`icon ${d.icon} mr-5`" /> {{ t(d.label) }}
            </div>
          </td>
          <td>
            <a
              v-if="d.imageList"
              tabindex="0"
              :data-testid="`image_list_download_link__${d.label}`"
              role="link"
              :aria-label="t('about.versions.downloadImages', { listName: t(d.label) })"
              @click="d.imageList"
              @keyup.enter="d.imageList"
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
          v-for="(d, i) in downloadCli"
          :key="i"
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
              role="link"
              :aria-label="t('about.versions.downloadCli', { os: t(d.label) })"
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
