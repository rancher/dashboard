<script>
import { mapGetters } from 'vuex';
import { options } from '@/config/footer';
import { mapPref, DEV } from '@/store/prefs';
import { MANAGEMENT } from '@/config/types';

const UNKNOWN = 'unknown';
const UI_VERSION = process.env.VERSION || UNKNOWN;
const UI_COMMIT = process.env.COMMIT || UNKNOWN;

export default {
  data() {
    const setting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'server-version');
    const fullVersion = setting?.value || 'unknown';
    let displayVersion = fullVersion;

    const match = fullVersion.match(/^(.*)-([0-9a-f]{40})-(.*)$/);

    if ( match ) {
      displayVersion = match[2].substr(0, 7);
    }

    return {
      displayVersion,
      fullVersion,
      uiCommit:       UI_COMMIT,
      uiVersion:      UI_VERSION
    };
  },

  computed: {
    ...mapGetters('i18n', ['selectedLocaleLabel', 'availableLocales']),

    dev: mapPref(DEV),

    showLocale() {
      return Object.keys(this.availableLocales).length > 1 || this.dev;
    },

    showNone() {
      return this.dev;
    },

    pl() {
      // @TODO PL support
      return 'rancher';
    },

    options() {
      return options(this.pl);
    },

    versionTooltip() {
      const out = [
        // `Dashboard: ${ this.uiVersion } (${ this.uiCommit })`,
      ];

      if ( this.fullVersion !== this.displayVersion ) {
        // out.push(`Server: ${ this.fullVersion }`);
        out.push(this.fullVersion);
      }

      return out.join('<br/>\n');
    }
  },

  methods: {
    switchLocale(locale) {
      this.$store.dispatch('i18n/switchTo', locale);
    }
  }
};

</script>

<template>
  <div class="footer">
    <div v-tooltip="versionTooltip" v-html="displayVersion" />

    <div v-for="(value, name) in options" :key="name">
      <a v-t="name" :href="value" target="_blank" />
    </div>

    <div class="space" />

    <div v-if="showLocale" class="locale-selector">
      <v-popover
        placement="top"
        trigger="click"
        :container="false"
      >
        <a class="hand">
          {{ selectedLocaleLabel }}
        </a>

        <template slot="popover">
          <ul class="list-unstyled dropdown" style="margin: -1px;">
            <li v-if="showNone" v-close-popover="true" v-t="'locale.none'" class="hand" @click="switchLocale('none')" />
            <li
              v-for="(value, name) in availableLocales"
              :key="name"
              v-close-popover="true"
              class="hand"
              @click="switchLocale(name)"
            >
              {{ value }}
            </li>
          </ul>
        </template>
      </v-popover>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    border-top: solid thin var(--border);

    > DIV {
      line-height: 30px;
      padding: 10px 20px;

      &.space {
        flex-grow: 1;
      }
    }

    .locale-selector {

      ::v-deep .popover-inner {
        padding: 10px 0;
      }

      ::v-deep .popover-arrow {
        display: none;
      }

      ::v-deep .popover:focus {
        outline: 0;
      }

      li {
        padding: 0 20px;

        &:hover {
          background-color: var(--dropdown-hover-bg);
          color: var(--dropdown-hover-text);
          text-decoration: none;
        }
      }
    }
  }
</style>
