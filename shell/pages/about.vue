<script>
import Loading from '@shell/components/Loading';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getVendor } from '@shell/config/private-label';
import { mapGetters } from 'vuex';
import TabTitle from '@shell/components/TabTitle';
import { PanelLocation, ExtensionPoint } from '@shell/core/types';
import ExtensionPanel from '@shell/components/ExtensionPanel';
import { getVersionInfo } from '@shell/utils/version';

export default {
  components: {
    BackLink, ExtensionPanel, Loading, TabTitle
  },
  mixins: [BackRoute],
  async fetch() {
    this.settings = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
  },
  data() {
    return {
      extensionType:     ExtensionPoint.PANEL,
      extensionLocation: PanelLocation.ABOUT_TOP,
      dashboardVersion:  this.$config.dashboardVersion,
      settings:          null,
      SETTING
    };
  },
  computed: {
    ...mapGetters(['releaseNotesUrl']),
    rancherVersion() {
      return getVersionInfo(this.$store).fullVersion;
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
        this.createOSOption('about.os.mac', 'icon-apple', this.settings?.find((s) => s.id === SETTING.CLI_URL.DARWIN)?.value),
        this.createOSOption('about.os.linux', 'icon-linux', this.settings?.find((s) => s.id === SETTING.CLI_URL.LINUX)?.value),
        this.createOSOption('about.os.windows', 'icon-windows', this.settings?.find((s) => s.id === SETTING.CLI_URL.WINDOWS)?.value)
      ];
    },
    downloadCli() {
      return this.downloads.filter((d) => !!d.cliLink);
    }
  },
  methods: {
    createOSOption(label, icon, cliLink) {
      const slash = cliLink?.lastIndexOf('/');

      return {
        label,
        icon,
        cliLink,
        cliFile: slash >= 0 ? cliLink.substr(slash + 1, cliLink.length - 1) : cliLink
      };
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
    <!-- Extensions area -->
    <ExtensionPanel
      :resource="{}"
      :type="extensionType"
      :location="extensionLocation"
    />
    <h3>{{ t('about.versions.title') }}</h3>
    <table>
      <thead>
        <tr>
          <th class="custom-th">
            {{ t('about.versions.component') }}
          </th>
          <th class="custom-th">
            {{ t('about.versions.version') }}
          </th>
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
        </td><td>{{ rancherVersion }}</td>
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
          <th>
            <div class="os">
              <i :class="`icon ${d.icon} mr-5`" /> {{ t(d.label) }}
            </div>
          </th>
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

    tr > th:first-of-type {
      width: 20%;
    }

    th, td {
      border: 1px solid var(--border);
      padding: 8px 5px;
      min-width: 150px;
      text-align: left;
    }

    th.custom-th {
      background-color: var(--sortable-table-top-divider);
      border-bottom: 1px solid var(--sortable-table-top-divider);
    }

    th:not(.custom-th) {
      font-weight: normal;
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
