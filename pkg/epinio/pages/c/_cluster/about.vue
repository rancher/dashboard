<script>
import { MANAGEMENT } from '@shell/config/types';
import { getVendor } from '@shell/config/private-label';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';

export default {
  layout:     'plain',
  components: { BackLink },
  mixins:     [BackRoute],
  async fetch() {
    this.settings = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
    const { version } = await this.$store.dispatch(`epinio/info`);

    this.version = version;
  },

  data() {
    return { version: null };
  },
  computed: {
    appName() {
      return getVendor();
    },

    downloads() {
      // TODO: Not sure if we can get the URL from the settings here.
      const gitUrl = `https://github.com/epinio/epinio/releases/download`;

      return [
        this.createOSOption('about.os.mac', 'icon-apple', `${ gitUrl }/${ this.version?.displayVersion }/${ this.appName.toLowerCase() }-darwin-x86_64`, null),
        this.createOSOption('about.os.linux', 'icon-linux', `${ gitUrl }/${ this.version?.displayVersion }/${ this.appName.toLowerCase() }-linux-x86_64`, this.downloadLinuxImages),
        this.createOSOption('about.os.windows', 'icon-windows', `${ gitUrl }/${ this.version?.displayVersion }/${ this.appName.toLowerCase() }-windows-x86_64.zip`)
      ];
    },
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
  }
};
</script>

<template>
  <div class="about">
    <template>
      <BackLink :link="backLink" />
      <h1 v-t="'about.title'">
        {{ appName }}
      </h1>
      <table>
        <thead>
          <tr>
            <th>{{ t('about.versions.component') }}</th>
            <th>{{ t('about.versions.version') }}</th>
          </tr>
        </thead>
        <tr v-if="version">
          <td>
            <a
              href="https://github.com/epinio/epinio"
              target="_blank"
              rel="nofollow noopener noreferrer"
            >
              {{ appName }}
            </a>
          </td><td>{{ version.displayVersion }}</td>
        </tr>
      </table>
    </template>
    <template v-if="version && downloads.length">
      <h3 class="pt-40">
        {{ t('about.downloadCLI.title') }}
      </h3>
      <table>
        <tr
          v-for="d in downloads"
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
    <template v-if="version">
      <a
        class="mt-5"
        target="_blank"
        :href="`https://github.com/epinio/epinio/releases/tag/${version.displayVersion}`"
      >
        {{ t('epinio.about.allPackages') }}
      </a>
    </template>
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

    .os {
      display: flex;
      align-items: center;
    }
  }
}

</style>
