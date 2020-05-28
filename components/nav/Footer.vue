<script>
import { mapGetters } from 'vuex';
import { options } from '@/config/footer';
import { mapPref, DEV } from '@/store/prefs';

const VERSION = process.env.VERSION || 'dev';
const COMMIT = process.env.COMMIT || 'unknown';

export default {
  data() {
    return {
      commit:  COMMIT,
      version: VERSION
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
    <div v-tooltip="commit">
      {{ version }}
    </div>

    <div v-for="(value, name) in options" :key="name">
      <a v-t="name" :href="value" target="_blank" />
    </div>

    <div class="space" />

    <div><a v-t="'footer.download'" href="https://github.com/rancher/cli/releases/latest" target="_blank" rel="nofollow noopener noreferrer" /></div>

    <div v-if="showLocale">
      <v-popover
        placement="top"
        trigger="click"
      >
        <a>
          {{ selectedLocaleLabel }}
        </a>

        <template slot="popover">
          <ul class="list-unstyled dropdown" style="margin: -1px;">
            <li v-if="showNone" v-t="'locale.none'" class="p-10 hand" @click="switchLocale('none')" />
            <li
              v-for="(value, name) in availableLocales"
              :key="name"
              class="p-10 hand"
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
  }
</style>
