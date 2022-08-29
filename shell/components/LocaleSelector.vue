<script>
import { mapGetters } from 'vuex';

export default {
  name: 'LocalSelector',

  computed: {
    ...mapGetters('i18n', ['selectedLocaleLabel', 'availableLocales']),

    showLocale() {
      return (this.availableLocales && Object.keys(this.availableLocales).length > 1) || this.dev;
    },

    showNone() {
      return !!process.env.dev && this.dev;
    },
  },

  methods: {
    switchLocale(locale) {
      this.$store.dispatch('i18n/switchTo', locale);
    },
  }
};
</script>

<template>
  <div v-if="showLocale">
    <v-popover
      popover-class="localeSelector"
      placement="top"
      trigger="click"
    >
      <a
        data-testid="locale-selector"
        class="locale-chooser"
      >
        {{ selectedLocaleLabel }}
        <i class="icon icon-fw icon-sort-down" />
      </a>

      <template slot="popover">
        <ul class="list-unstyled dropdown" style="margin: -1px;">
          <li v-if="showNone" v-t="'locale.none'" class="hand" @click="switchLocale('none')" />
          <li
            v-for="(label, name) in availableLocales"
            :key="name"
            class="hand"
            @click="switchLocale(name)"
          >
            {{ label }}
          </li>
        </ul>
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss" scoped>
.advanced {
  user-select: none;
  padding: 0 5px;
  line-height: 40px;
  font-size: 15px;
  font-weight: 500;
}
.content {
  background: var(--nav-active);
  padding: 10px;
  margin-top: 6px;
  border-radius: 4px;
}

.locale-chooser {
  cursor: pointer;

  &:hover {
    text-decoration: none;
  }
}
</style>
